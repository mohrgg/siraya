# 🏫 SIRAYA — Sistem Informasi & Manajemen Terpadu Yayasan Al-Basyariah

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)
![Caddy](https://img.shields.io/badge/Caddy-Auto--HTTPS-00ADEF?style=for-the-badge&logo=caddy)

**Platform Manajemen Akademik, Keuangan Terintegrasi, dan Rekonsiliasi Administrasi Multi-Unit Yayasan Pendidikan Al-Basyariah.**

[Fitur Utama](#-fitur-utama) • [Tech Stack](#-arsitektur--tech-stack) • [Panduan Instalasi](#-panduan-instalasi-lokal) • [Deployment VPS](#-deployment-produksi-vps--docker) • [Struktur Proyek](#-struktur-direktori)

---

</div>

## 📌 Sekilas Proyek

**SIRAYA** adalah aplikasi web modern berbasis *enterprise* yang dirancang khusus untuk memenuhi kebutuhan tata kelola operasional yayasan pendidikan bertingkat. Aplikasi ini menangani ribuan siswa aktif, puluhan rombongan belajar (rombel), serta ribuan transaksi keuangan harian dari berbagai unit pendidikan (TK, SD, SMP, SMA, SMK) dalam satu ekosistem terpadu.

---

## ✨ Fitur Utama

### 1. 🎓 Profil Siswa 360° & Master Data
- **Dedicated 360° Student Cockpit**: Informasi data diri lengkap, data wali, riwayat kelas/rombel, dan timeline tagihan serta pembayaran.
- **Multi-Unit Sekolah**: Dukungan terintegrasi untuk TK, SD, SMP, SMA, hingga SMK.
- **Rombongan Belajar (Rombel)**: Manajemen penempatan siswa, kenaikan kelas, dan kapasitas kelas dengan side drawer lateral.
- **Import & Export Cepat**: Dukungan import data Excel massal dan ekspor data siswa.

### 2. 💳 Modul Keuangan & Kasir Terpadu
- **Pembayaran Tagihan**: Pembayaran SPP bulanan, DSP, uang seragam, uang buku, dan tagihan khusus lainnya.
- **Kas Masuk & Kas Keluar**: Pencatatan arus kas real-time dengan filter multi-preset (Hari Ini, Pekan Ini, Bulan Ini, Bulan Lalu, Kustom).
- **Klasifikasi Beban Pengeluaran**: Pengelompokan pengeluaran otomatis (Gaji, Operasional, ATK, Utilitas, dsb).
- **Cetak Bukti Transaksi (Kwitansi / Resi)**: Generator resi pembayaran standar siap cetak dan ekspor format PDF.

### 3. 📊 Laporan & Akuntansi
- **Buku Kas & Arus Kas**: Rekapitulasi transaksi masuk dan keluar berbasis periode.
- **Pemasukan vs Pengeluaran**: Analisis komparasi finansial per unit maupun konsolidasi yayasan.
- **Mutasi Rekening Bank**: Pencatatan pergerakan saldo kas tunai dan rekening bank sekolah.
- **Rekap Tunggakan**: Audit cepat siswa yang belum menyelesaikan kewajiban administrasi.

### 4. 🛡️ Keamanan & Akses Kontrol (RBAC)
- **Role-Based Access Control Granular**:
  - `SUPERADMIN` (Yayasan / Full Cockpit)
  - `KEPALA_SEKOLAH` (Audit Read-Only & Laporan Eksekutif)
  - `TATA_USAHA` / `KASIR` (Operasional Administrasi & Transaksi)
- **Audit Trails**: Pencatatan log aktivitas sistem untuk transparansi audit.

### 5. ⚡ System Telemetry & Infrastructure Health
- **Live System Telemetry**: Monitoring real-time penggunaan CPU, RAM, dan kapasitas penyimpanan (disk) server VPS.
- **Database Telemetry**: Pengawasan konektivitas pool, latensi query, dan kapasitas database PostgreSQL.
- **SSL Auto-Inspector**: Pemantauan masa aktif sertifikat HTTPS TLS Caddy.

---

## 🛠️ Arsitektur & Tech Stack

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) | Server Actions, Standalone Output |
| **UI Library** | [React 19](https://react.dev) & [Tailwind CSS](https://tailwindcss.com) | Unified Design System & Responsive |
| **Language** | [TypeScript](https://www.typescriptlang.org) | End-to-end type safety |
| **ORM** | [Prisma ORM 6](https://www.prisma.io) | Relational modeling & migrations |
| **Database** | [PostgreSQL 16](https://www.postgresql.org) | Dockerized high-performance relational DB |
| **Authentication** | [NextAuth.js](https://authjs.dev) | Session-based authentication |
| **Web Server / Proxy** | [Caddy v2](https://caddyserver.com) | Reverse proxy dengan Automatic HTTPS (Let's Encrypt) |
| **Containerization** | [Docker](https://www.docker.com) & Docker Compose | Multi-stage build runner |

---

## 🚀 Panduan Instalasi Lokal

### 1. Prasyarat
- **Node.js**: `v20.x` atau lebih baru
- **npm** / **pnpm**
- **PostgreSQL**: Instans lokal atau via Docker

### 2. Kloning Repositori
```bash
git clone https://github.com/mohrgg/siraya.git
cd siraya
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan konfigurasi `DATABASE_URL`, `NEXTAUTH_SECRET`, dan `APP_URL`.

### 4. Install Dependensi & Generate Prisma
```bash
npm install
npx prisma generate
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:3000`

---

## 🐳 Deployment Produksi (VPS & Docker)

Aplikasi telah dilengkapi konfigurasi Docker lengkap (`Dockerfile`, `docker-compose.yml`, dan `Caddyfile`).

### 1. Struktur Layanan Docker:
- **`siraya-db`**: PostgreSQL 16 Alpine dengan persistent volume.
- **`siraya-app`**: Next.js Node.js runner (multi-stage build teroptimasi).
- **`siraya-proxy`**: Caddy web server menangani auto SSL HTTPS port 80 & 443.

### 2. Langkah Menjalankan di VPS:
```bash
# 1. Konfigurasi file environment
cp .env.example .env
nano .env # Masukkan password DB dan konfigurasi domain

# 2. Build dan jalankan seluruh container di background
docker compose up -d --build

# 3. Periksa status container
docker compose ps
```

### 3. Backup Database Otomatis:
Cron job harian direkomendasikan berjalan pada jam 02:00 subuh:
```bash
0 2 * * * docker exec -i siraya-db pg_dump -U siraya_admin -d siraya_albasyariah | gzip > /home/ubuntu/backup_siraya/backup_$(date +\%F).sql.gz && find /home/ubuntu/backup_siraya/ -mtime +14 -delete
```

---

## 📁 Struktur Direktori

```text
siraya/
├── Caddyfile                  # Konfigurasi reverse proxy & SSL HTTPS
├── Dockerfile                 # Multi-stage production build Next.js
├── docker-compose.yml         # Orkestrasi container (App, DB, Proxy)
├── prisma/
│   └── schema.prisma          # Skema database relasional
├── public/                    # Aset statis & logo yayasan
├── src/
│   ├── actions/               # Server Actions (Mutasi data & query)
│   ├── app/                   # Next.js App Router (Halaman & layout)
│   │   ├── (auth)/            # Autentikasi & login
│   │   ├── (dashboard)/       # Layout dashboard utama
│   │   │   ├── (keuangan)/    # Modul kasir, kas masuk/keluar, akun
│   │   │   ├── (laporan)/     # Modul rekapitulasi & buku kas
│   │   │   ├── (master)/      # Modul data siswa, guru, kelas
│   │   │   └── (sistem)/      # Monitoring telemetri & pengaturan
│   ├── components/            # Komponen antarmuka (UI, tabel, drawer)
│   ├── lib/                   # Utility helpers & Prisma client instance
│   └── types/                 # Definisi tipe TypeScript
└── README.md
```

---

## 📄 Lisensi & Hak Cipta

Hak Cipta © 2026 **Yayasan Pendidikan Al-Basyariah**. Seluruh hak cipta dilindungi undang-undang.
Dikelola dan dikembangkan untuk operasional internal satuan pendidikan Al-Basyariah.
