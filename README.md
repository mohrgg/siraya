<div align="center">

  <img src="public/logo.png" alt="Logo SIRAYA" width="100" />

  # SIRAYA
  
  **Sistem Informasi & Manajemen Keuangan Terpadu Yayasan Al-Basyariah**
  
  *Platform Tata Kelola Akademik, Kasir Tagihan Multi-Unit, dan Rekonsiliasi Finansial Terpusat.*

  <p>
    <a href="https://siraya.my.id"><strong>Kunjungi Aplikasi Live (siraya.my.id) »</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.0-23272f?style=flat-square&logo=react&logoColor=61dafb" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-6.x-2d3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-Production_Ready-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Caddy-Auto_HTTPS-1f883d?style=flat-square&logo=caddy&logoColor=white" alt="Caddy" />
  </p>

</div>

---

## Daftar Isi
- [Latar Belakang](#latar-belakang)
- [Modul & Fitur Sistem](#modul--fitur-sistem)
- [Arsitektur & Tech Stack](#arsitektur--tech-stack)
- [Alur Kerja Transaksi](#alur-kerja-transaksi)
- [Panduan Instalasi Lokal](#panduan-instalasi-lokal)
- [Deployment Produksi (VPS & Docker)](#deployment-produksi-vps--docker)
- [Struktur Direktori](#struktur-direktori)
- [Lisensi](#lisensi)

---

## Latar Belakang

**SIRAYA** dibangun untuk mengintegrasikan proses operasional dan akuntansi keuangan di bawah naungan Yayasan Pendidikan Al-Basyariah. Sistem ini menghubungkan 5 unit tingkatan sekolah (TK, SD, SMP, SMA, SMK) ke dalam satu pangkalan data terpusat, mengeliminasi duplikasi data siswa dan mempercepat audit kas harian.

---

## Modul & Fitur Sistem

### 1. Profil Siswa 360° (Master Data)
- **360° Student Dossier**: Lembar ringkasan per siswa yang menyajikan data identitas, histori kelas/rombel, mutasi keluar-masuk, serta rekapitulasi status tunggakan dalam satu tampilan.
- **Hierarki Multi-Unit**: Isolasi data per jenjang (TK, SD, SMP, SMA, SMK) dengan audit konsolidasi di tingkat yayasan.
- **Rombongan Belajar (Rombel)**: Panel drawer lateral untuk alokasi siswa, penyesuaian wali kelas, dan kenaikan kelas berkala.
- **Import / Export Spreadsheet**: Impor data siswa massal via Excel (.xlsx) dan ekspor siap cetak.

### 2. POS Kasir & Manajemen Tagihan Siswa
- **Multi-Komponen Tagihan**: Pengelolaan pos pembayaran bulanan (SPP), pembayaran bertahap (DSP / Uang Pangkal), hingga biaya berkala (seragam, buku, ujian).
- **Checkout Kasir Cepat**: Pencatatan pembayaran tunai maupun transfer dengan verifikasi nomor transaksi unik otomatis.
- **Generator Resi & Bukti Bayar**: Cetak kwitansi fisik ukuran struk/kertas invoice dan ekspor arsip PDF.

### 3. Pembukuan & Arus Kas (Cashflow)
- **Buku Kas Masuk & Kas Keluar**: Pencatatan arus kas dengan 6 preset rentang waktu (Semua, Hari Ini, Pekan Ini, Bulan Ini, Bulan Lalu, Kustom).
- **Klasifikasi 5 Beban**: Kategorisasi beban otomatis pada kas keluar (Gaji Pendidik/Tenaga Kependidikan, Operasional, ATK, Utilitas, Pemeliharaan).
- **Rekonsiliasi Bank**: Pencatatan mutasi saldo rekening yayasan dan pencocokan penerimaan kas kasir.
- **Rekapitulasi Tunggakan**: Filter multi-kriteria untuk memetakan siswa dengan piutang tertunggak per rombel atau tahun ajaran.

### 4. Telemetri Sistem & Health Monitoring
- **Server Resource Monitor**: Pemantauan beban CPU, penggunaan memori RAM, dan kapasitas penyimpanan NVMe VPS secara langsung dari dashboard.
- **Database Telemetry**: Pengawasan koneksi pool PostgreSQL, latensi eksekusi query, serta ukuran tabel data.
- **SSL Auto-Inspector**: Pemantauan otomatis masa aktif sertifikat TLS Caddy (Let's Encrypt).

### 5. Keamanan & Akses Pengguna (RBAC)
- Pemisahan hak akses berbasis peran:
  - `SUPERADMIN`: Akses menyeluruh data yayasan, konfigurasi akun keuangan, dan telemetri server.
  - `KEPALA_SEKOLAH`: Audit data siswa, ringkasan eksekutif, dan laporan pembukuan read-only.
  - `TATA_USAHA` / `KASIR`: Operasional entri transaksi, mutasi data siswa, dan cetak bukti bayar.
- **Audit Trails**: Rekaman log pencatatan aksi kritis (hapus transaksi, mutasi akun, ubah data murid).

---

## Arsitektur & Tech Stack

```text
               +-------------------------------------------------+
               |             Internet / Web Browser              |
               +-------------------------------------------------+
                                        | (HTTPS / Port 443)
                                        v
               +-------------------------------------------------+
               |           Caddy 2 Reverse Proxy (Docker)        |
               |       Automated Let's Encrypt TLS Management    |
               +-------------------------------------------------+
                                        | (Internal Docker Network)
                                        v
               +-------------------------------------------------+
               |             Next.js 16 Web App (Node)           |
               |        React 19 / Server Actions / Prisma       |
               +-------------------------------------------------+
                                        | (TCP / Port 5432)
                                        v
               +-------------------------------------------------+
               |          PostgreSQL 16 Database (Docker)        |
               |              Persistent Data Volumes            |
               +-------------------------------------------------+
```

### Spesifikasi Komponen

| Lapisan | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router, Turbopack) | Server Components & Server Actions |
| **UI & Styling** | React 19, Tailwind CSS | Unified Tabbed Card Layout & Responsive UI |
| **Komponen Ikon** | Lucide React | Ikon antarmuka semantik |
| **Database ORM** | Prisma ORM 6.x | Schema migrations & type-safe queries |
| **Sistem Basis Data** | PostgreSQL 16 Alpine | Relational ACID database |
| **Autentikasi** | NextAuth.js (Auth.js) v5 | Session cookie dengan enkripsi JWT |
| **Reverse Proxy** | Caddy v2 Alpine | Automatic TLS generation & renewal |
| **Container Engine** | Docker & Docker Compose | Multi-stage build (distroless standalone runner) |

---

## Alur Kerja Transaksi

```text
[Siswa Terdaftar] 
       │
       ▼
[Penerbitan Tagihan] (SPP, DSP, Buku, Ujian)
       │
       ▼
[Loket Kasir / Bank] ──► [Input Transaksi] ──► [Verifikasi Pembayaran]
                                                       │
                     ┌─────────────────────────────────┴────────────────────────┐
                     ▼                                                          ▼
             [Cetak Bukti Resi]                                        [Pembaruan Status]
            (Format PDF / Thermal)                                     (Lunas / Piutang Berkurang)
                     │                                                          │
                     └────────────────────────┬─────────────────────────────────┘
                                              ▼
                                 [Jurnal Kas Masuk Terupdate]
                                              │
                                              ▼
                               [Laporan Finansial Konsolidasi]
```

---

## Panduan Instalasi Lokal

### 1. Prasyarat Sistem
- Node.js versi 20.x ke atas
- npm atau pnpm
- PostgreSQL instans lokal aktif (atau via Docker)

### 2. Kloning Repositori
```bash
git clone https://github.com/mohrgg/siraya.git
cd siraya
```

### 3. Konfigurasi Variabel Lingkungan
Salin file `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai konfigurasi:
```env
POSTGRES_USER=siraya_admin
POSTGRES_PASSWORD=password_lokal_anda
POSTGRES_DB=siraya_albasyariah
DATABASE_URL="postgresql://siraya_admin:password_lokal_anda@localhost:5432/siraya_albasyariah?schema=public"
NEXTAUTH_SECRET=rahasia_acak_minimal_32_karakter
AUTH_TRUST_HOST=true
APP_URL=http://localhost:3000
```

### 4. Instalasi Dependensi & Setup Skema
```bash
# Install paket dependensi
npm install

# Sinkronkan skema database Prisma
npx prisma generate
npx prisma db push
```

### 5. Menjalankan Server Development
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:3000`.

---

## Deployment Produksi (VPS & Docker)

Aplikasi siap dijalankan di server Linux (Ubuntu 22.04 / 24.04 LTS) menggunakan Docker Compose.

### 1. Persiapan Server
Pastikan Docker dan Docker Compose telah terpasang di VPS:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```

### 2. Pengaturan File `.env` Produksi
```bash
cd ~/siraya
cp .env.example .env
nano .env
```
Isi dengan kredensial produksi dan domain Anda:
```env
POSTGRES_USER=siraya_admin
POSTGRES_PASSWORD=password_produksi_yang_kuat
POSTGRES_DB=siraya_albasyariah
DATABASE_URL="postgresql://siraya_admin:password_produksi_yang_kuat@siraya-db:5432/siraya_albasyariah?schema=public"
NEXTAUTH_SECRET=rahasia_acak_minimal_32_karakter
AUTH_TRUST_HOST=true
APP_URL=https://domain-anda.com
```

### 3. Build & Jalankan Container
```bash
# Build image aplikasi dan jalankan 3 container (Proxy, App, DB)
docker compose up -d --build

# Periksa status kontainer
docker compose ps
```

### 4. Setup Pencadangan Otomatis (Cron Job)
Pasang cron job pada VPS untuk mencadangkan database setiap hari pukul 02:00 subuh serta menghapus berkas lebih dari 14 hari:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec -i siraya-db pg_dump -U siraya_admin -d siraya_albasyariah | gzip > /home/ubuntu/backup_siraya/backup_\$(date +\%F).sql.gz && find /home/ubuntu/backup_siraya/ -name 'backup_*.sql.gz' -mtime +14 -delete") | crontab -
```

---

## Struktur Direktori

```text
siraya/
├── Caddyfile                  # Konfigurasi reverse proxy Caddy & auto HTTPS
├── Dockerfile                 # Multi-stage image build (Next.js standalone)
├── docker-compose.yml         # Konfigurasi orkestrasi Caddy, App, dan Postgres
├── prisma/
│   └── schema.prisma          # Skema model basis data relasional
├── public/
│   ├── logo.png               # Identitas visual resmi yayasan
│   ├── templates/             # Template berkas impor Excel
│   └── uploads/               # Direktori penyimpanan media (git-ignored)
├── src/
│   ├── actions/               # Server Actions (logika bisnis & mutasi transaksi)
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Autentikasi & login
│   │   ├── (dashboard)/       # Layout dashboard utama
│   │   │   ├── (keuangan)/    # Kas Masuk, Kas Keluar, Akun Keuangan, Tagihan
│   │   │   ├── (laporan)/     # Buku Kas, Mutasi Bank, Arus Kas
│   │   │   ├── (master)/      # Murid 360°, Guru, Rombel, Unit Sekolah
│   │   │   └── (sistem)/      # Telemetri VPS, Monitoring DB, Pengaturan
│   ├── components/            # Komponen UI (tabel, drawer, modal, banner)
│   ├── lib/                   # Klien Prisma, utilitas waktu, dan query helper
│   └── types/                 # Definisi tipe TypeScript
└── README.md                  # Dokumentasi proyek
```

---

## Lisensi

Hak Cipta © 2026 Yayasan Pendidikan Al-Basyariah. Seluruh hak cipta dilindungi undang-undang.  
Sistem ini dirancang dan dikembangkan untuk operasional internal satuan pendidikan Yayasan Al-Basyariah.
