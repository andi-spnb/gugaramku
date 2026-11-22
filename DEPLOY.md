# 🚀 PANDUAN DEPLOY PRODUCTION — GuGaramKu

> Target: 1 VPS Ubuntu 24.04 LTS, PostgreSQL 16, Nginx + SSL, PM2.
> Arsitektur mengikuti `docs/SYSTEM_ARCHITECTURE.md`.

## ⛔ SEBELUM MEMULAI — BLOKRIR GO-LIVE

**Jangan deploy ke production sebelum 7 temuan KRITIS di `docs/LAPORAN_AUDIT_2026-11-23.md` diperbaiki.** Yang paling memblokir proses deploy ini secara teknis:

1. **K4**: Prisma masih `provider = "sqlite"` dan belum ada folder `migrations/`. Langkah 5 di bawah TIDAK AKAN bekerja sebelum ini diperbaiki.
2. **K5**: JANGAN PERNAH jalankan `prisma db seed` di production — seed membuat dan me-reset akun owner dengan password `owner123` yang diketahui publik.
3. **K7**: Next.js 14.2.35 punya 3 advisory critical yang belum dipatch. Minimal hapus wildcard `images.remotePatterns` di `next.config.js` sebelum expose ke internet.

Prasyarat perbaikan kode, lalu ikuti panduan ini.

---

## 1. Spesifikasi VPS

| Fase | CPU | RAM | Storage | Lokasi |
|---|---|---|---|---|
| 1 toko (MVP) | 2 vCPU | 4 GB | 50 GB SSD | Jakarta (IDCloudHost / Niagahoster / Biznet Gio) |
| Multi-cabang | 4 vCPU | 8 GB | 100 GB SSD | Jakarta |

Estimasi biaya: Rp 150–250 ribu/bulan untuk spesifikasi MVP.

## 2. Setup awal server

Login sebagai root, buat user deploy, dan amankan server:

```bash
# Update & dasar
apt update && apt upgrade -y
apt install -y curl git ufw

# User khusus deploy (jangan pakai root)
adduser deploy
usermod -aG sudo deploy

# Firewall: hanya SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

> Port 3000 (Next.js), 3001 (socket, bila nanti ada), dan 5432 (PostgreSQL) **tidak** dibuka ke publik.

## 3. Install runtime

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# PostgreSQL 16
apt install -y postgresql postgresql-contrib

# PM2 (process manager)
npm install -g pm2

# Nginx + Certbot (SSL)
apt install -y nginx certbot python3-certbot-nginx
```

## 4. Setup database

```bash
sudo -u postgres psql
```

```sql
CREATE USER gugaramku WITH PASSWORD 'GANTI_dengan_password_kuat';
CREATE DATABASE gugaramku OWNER gugaramku;
\q
```

> Simpan password ini untuk `DATABASE_URL`. Jangan pakai password contoh.

## 5. Deploy aplikasi

```bash
# Masuk sebagai deploy
su - deploy

# Clone
git clone https://github.com/andi-spnb/gugaramku.git
cd gugaramku

# Environment production
cp .env.example .env
nano .env
```

Isi `.env` production (variabel yang benar-benar dipakai aplikasi):

```env
DATABASE_URL="postgresql://gugaramku:PASSWORD@localhost:5432/gugaramku?schema=public"
AUTH_SECRET="hasil-dari: openssl rand -base64 32"
AUTH_URL="https://domain-anda.com"
NEXT_PUBLIC_APP_URL="https://domain-anda.com"
```

> **Catatan**: `NEXT_PUBLIC_*` di-bake saat build. Kalau nanti diganti, wajib build ulang.
> `AUTH_SECRET` wajib baru dan tidak boleh sama dengan yang ada di `.env` development.

Build & migrasi:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy   # butuh folder prisma/migrations/ (lihat blokir K4)
npm run build
```

> **PERINGATAN**: jangan jalankan `prisma db seed` dan jangan jalankan `prisma db push` di production. Akun owner pertama dibuat manual (lihat langkah 8).

## 6. Jalankan dengan PM2

Buat `ecosystem.config.js` di root proyek:

```js
module.exports = {
  apps: [
    {
      name: 'gugaramku-web',
      cwd: '/home/deploy/gugaramku',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1, // naikkan ke 2 setelah rate limit pindah ke Redis (audit T9)
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
pm2 startup   # ikuti perintah yang muncul, jalankan sebagai sudo
pm2 save
```

## 7. Nginx + SSL

```bash
sudo nano /etc/nginx/sites-available/gugaramku
```

```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gugaramku /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL gratis Let's Encrypt
sudo certbot --nginx -d domain-anda.com
```

## 8. Buat akun owner pertama (tanpa seed)

Setelah aplikasi jalan, buat akun owner dengan password acak:

```bash
cd /home/deploy/gugaramku
node -e "
const bcrypt = require('bcryptjs');
const pass = require('crypto').randomBytes(12).toString('base64url');
console.log('Password owner:', pass);
require('@prisma/client');
"
```

Atau lebih mudah: buat akun lewat skrip one-off `scripts/create-owner.ts` (perlu dibuat) yang menerima email + password dari prompt dan langsung meng-hash bcrypt. **Jangan pernah memakai `owner123`.**

## 9. Backup otomatis (WAJIB sebelum go-live)

Buat `scripts/backup.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/deploy/backups
mkdir -p $BACKUP_DIR
pg_dump -U gugaramku gugaramku | gzip > $BACKUP_DIR/gugaramku_$TIMESTAMP.sql.gz
# Simpan salinan ke luar VPS (contoh: rclone ke Google Drive / object storage)
# rclone copy $BACKUP_DIR/gugaramku_$TIMESTAMP.sql.gz remote:gugaramku-backup
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
chmod +x scripts/backup.sh
# Cron harian jam 2 pagi
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/gugaramku/scripts/backup.sh >> /home/deploy/backups/backup.log 2>&1") | crontab -
```

**Uji restore satu kali** sebelum go-live: `gunzip -c backup.sql.gz | psql -U gugaramku gugaramku` ke database kosong, pastikan tabel terisi.

## 10. Checklist go-live

- [ ] Semua temuan KRITIS di `docs/LAPORAN_AUDIT_2026-11-23.md` statusnya "fix"
- [ ] `prisma/schema.prisma` sudah `provider = "postgresql"` + folder `migrations/` ter-commit
- [ ] `npm audit` tidak menyisa temuan critical/high di dependencies production
- [ ] `AUTH_SECRET` produksi baru (belum pernah dipakai di mana pun)
- [ ] `AUTH_URL` & `NEXT_PUBLIC_APP_URL` menunjuk domain produksi (lalu build ulang)
- [ ] Seed TIDAK dijalankan; akun owner dengan password acak sudah dibuat & tes login
- [ ] HTTPS aktif (certbot) dan redirect 80 → 443
- [ ] Backup harian jalan + restore sudah diuji
- [ ] Firewall: hanya 22/80/443; 3000/5432 tertutup dari luar
- [ ] Uptime monitoring (mis. UptimeRobot free) mengarah ke domain
- [ ] Tes transaksi end-to-end di production: jual tunai → cek stok berkurang, kas bertambah, struk keluar

## 11. Deploy ulang (update versi)

```bash
cd /home/deploy/gugaramku
git pull origin master
npm ci
npx prisma migrate deploy
npm run build
pm2 reload gugaramku-web
```

## 12. Troubleshooting cepat

| Gejala | Cek |
|---|---|
| Semua API 500 | `pm2 logs gugaramku-web` — biasanya `DATABASE_URL` salah atau migrasi belum jalan |
| Login loop ke /login | `AUTH_URL` tidak sama dengan domain yang diakses; cookie secure butuh HTTPS |
| Nginx 502 | `pm2 status` — app mati atau port salah; cek `pm2 logs` |
| SSL gagal renew | `sudo certbot renew --dry-run`; pastikan cron certbot jalan |
