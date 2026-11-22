import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { logActivity } from '@/lib/audit-log';

// ===========================================
// Rate limiting login (in-memory, per email)
// 5 percobaan gagal -> lockout 15 menit.
// Catatan: cukup untuk single-instance; untuk
// multi-instance gunakan Redis (upstash/ratelimit).
// ===========================================
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    const menit = Math.ceil((attempt.lockedUntil - now) / 60000);
    throw new Error(`Terlalu banyak percobaan gagal. Coba lagi dalam ${menit} menit.`);
  }
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || (attempt.lockedUntil && attempt.lockedUntil <= now)) {
    loginAttempts.set(key, { count: 1, lockedUntil: 0 });
    return;
  }

  attempt.count += 1;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_MS;
    attempt.count = 0;
  }
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 jam
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        pin: { label: 'PIN', type: 'password' },
        loginMode: { label: 'Login Mode', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email wajib diisi');
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;
        const pin = credentials.pin as string;
        const loginMode = (credentials.loginMode as string) || 'password';

        // Cek rate limit sebelum proses apa pun
        checkRateLimit(email);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            cabang: {
              select: {
                id: true,
                kode: true,
                nama: true,
              },
            },
          },
        });

        if (!user) {
          // Konsumsi rate limit agar email tak terdaftar tidak bisa diprobing tanpa batas
          recordFailedAttempt(email);
          throw new Error('Email atau password/PIN salah');
        }

        const failLogin = (): never => {
          recordFailedAttempt(email);
          throw new Error('Email atau password/PIN salah');
        };

        // Validate based on login mode
        if (loginMode === 'pin') {
          // PIN login (PIN di-hash dengan bcrypt)
          if (!pin || !user.pin || !(await bcrypt.compare(pin, user.pin))) {
            failLogin();
          }
        } else {
          // Password login
          if (!password || !(await bcrypt.compare(password, user.password))) {
            failLogin();
          }
        }

        // Cek status aktif SETELAH kredensial valid
        // (pesan disamakan dengan gagal login supaya email tidak bisa dienumerasi)
        if (!user.isActive) {
          failLogin();
        }

        // Login sukses: reset pencacat percobaan
        clearRateLimit(email);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        await logActivity({
          userId: user.id,
          aksi: 'LOGIN',
          tabel: 'user',
          recordId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
          cabangId: user.cabangId,
          cabangNama: user.cabang?.nama || null,
          cabangKode: user.cabang?.kode || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.cabangId = user.cabangId as string | null;
        token.cabangNama = user.cabangNama as string | null;
        token.cabangKode = user.cabangKode as string | null;
      }
      if (trigger === 'update' && token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nama: true, email: true },
        });
        if (current) {
          token.name = current.nama;
          token.email = current.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.cabangId = token.cabangId as string | null;
        session.user.cabangNama = token.cabangNama as string | null;
        session.user.cabangKode = token.cabangKode as string | null;
      }
      return session;
    },
  },
});
