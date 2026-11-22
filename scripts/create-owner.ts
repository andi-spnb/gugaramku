/**
 * Buat akun owner pertama di production (pengganti seed demo).
 *
 * Password & PIN di-generate acak dan ditampilkan SEKALI di terminal.
 * Cabang dibuat bila belum ada, lengkap dengan saldo kas awal Rp 0.
 *
 * Pakai: npm run create-owner
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { randomBytes, randomInt } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const email = (await rl.question('Email owner: ')).trim().toLowerCase();
  const nama = (await rl.question('Nama owner: ')).trim();
  const cabangKode = (await rl.question('Kode cabang (Enter = PST): ')).trim() || 'PST';
  rl.close();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('❌ Email tidak valid');
    process.exit(1);
  }
  if (nama.length < 2) {
    console.error('❌ Nama wajib diisi (minimal 2 karakter)');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('❌ Email sudah terdaftar. Gunakan email lain.');
    process.exit(1);
  }

  // Password acak 12 karakter & PIN 4 digit — tidak bisa ditebak
  const password = randomBytes(9).toString('base64url');
  const pin = String(randomInt(1000, 10000));

  // Cabang: pakai yang sudah ada, atau buat baru
  let cabang = await prisma.cabang.findUnique({ where: { kode: cabangKode } });
  if (!cabang) {
    cabang = await prisma.cabang.create({
      data: { kode: cabangKode, nama: `Cabang ${cabangKode}`, isActive: true },
    });
    console.log(`✅ Cabang dibuat: ${cabang.nama} (${cabang.kode})`);
  }

  // Pastikan cabang punya row Kas (penjualan tunai tanpa row Kas tidak tercatat)
  await prisma.kas.upsert({
    where: { cabangId: cabang.id },
    update: {},
    create: { cabangId: cabang.id, saldo: 0 },
  });

  const user = await prisma.user.create({
    data: {
      cabangId: cabang.id,
      nama,
      email,
      password: await bcrypt.hash(password, 10),
      pin: await bcrypt.hash(pin, 10),
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log(`\n✅ Owner dibuat: ${user.nama} <${user.email}>`);
  console.log('\n🔑 SIMPAN SEKARANG — kredensial ini hanya ditampilkan sekali:');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   PIN      : ${pin}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal membuat owner:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
