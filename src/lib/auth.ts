import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

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

        const email = credentials.email as string;
        const password = credentials.password as string;
        const pin = credentials.pin as string;
        const loginMode = (credentials.loginMode as string) || 'password';

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
          throw new Error('Email tidak terdaftar');
        }

        if (!user.isActive) {
          throw new Error('Akun tidak aktif. Hubungi administrator.');
        }

        // Validate based on login mode
        if (loginMode === 'pin') {
          // PIN login
          if (!pin) {
            throw new Error('PIN wajib diisi');
          }
          if (!user.pin) {
            throw new Error('PIN belum diatur untuk akun ini');
          }
          if (user.pin !== pin) {
            throw new Error('PIN salah');
          }
        } else {
          // Password login
          if (!password) {
            throw new Error('Password wajib diisi');
          }
          
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            throw new Error('Password salah');
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.cabangId = user.cabangId as string | null;
        token.cabangNama = user.cabangNama as string | null;
        token.cabangKode = user.cabangKode as string | null;
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
