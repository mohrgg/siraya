"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Helper Formatters
const formatRupiah = (angka: number | null | undefined) => {
  if (angka === null || angka === undefined || isNaN(angka)) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(angka)
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return "-"
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const formatBoolean = (val: boolean | null | undefined, trueText = "Aktif", falseText = "Non-Aktif") => {
  if (val === null || val === undefined) return "-"
  return val ? trueText : falseText
}

const getStatusText = (status: string | null | undefined) => {
  if (!status) return "-"
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export async function generateBackupData(selectedModules: string[], unitId: string) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Hanya ADMIN yang dapat melakukan pencadangan data." }
    }

    const backupData: Record<string, any[]> = {}
    const rawData: Record<string, any> = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        unitId: unitId || "GLOBAL",
        modules: selectedModules
      }
    }

    const isGlobal = !unitId || unitId === "GLOBAL"
    const unitFilter = isGlobal ? {} : { unitSekolahId: unitId }

    // ==========================================
    // 1. MODUL DATA MASTER AKADEMIK (8 Model)
    // ==========================================
    if (selectedModules.includes("akademik")) {
      // 1.1 Data Murid (Lengkap ~35 Field)
      const muridData = await prisma.murid.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true,
          riwayatKelas: {
            include: {
              subKelas: {
                include: {
                  tingkat: true,
                  jurusan: true
                }
              },
              tahunAkademik: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { name: 'asc' }
      })

      backupData["Data_Murid"] = muridData.map((m: any, index: number) => {
        const rk = m.riwayatKelas?.[0]
        const subKelas = rk?.subKelas
        return {
          "No.": index + 1,
          NIS: m.nis || "-",
          NISN: m.nisn || "-",
          NIK: m.nik || "-",
          Nama_Lengkap: m.name,
          Nama_Panggilan: m.nickname || "-",
          Jenis_Kelamin: m.gender || "-",
          Agama: m.religion || "-",
          Tempat_Lahir: m.birthPlace || "-",
          Tanggal_Lahir: formatDate(m.birthDate),
          Anak_Ke: m.childOrder ?? "-",
          Jumlah_Saudara: m.siblingCount ?? "-",
          Asal_Sekolah: m.previousSchool || "-",
          Tinggi_Badan_CM: m.height ?? "-",
          Berat_Badan_KG: m.weight ?? "-",
          Lingkar_Kepala_CM: m.headSize ?? "-",
          Jarak_Ke_Sekolah: m.distanceToSchool || "-",
          Waktu_Tempuh: m.travelTime || "-",
          Nama_Ayah: m.fatherName || "-",
          NIK_Ayah: m.fatherNik || "-",
          Thn_Lahir_Ayah: m.fatherBirthYear || "-",
          Pendidikan_Ayah: m.fatherEducation || "-",
          Pekerjaan_Ayah: m.fatherOccupation || "-",
          Penghasilan_Ayah: m.fatherIncome || "-",
          Nama_Ibu: m.motherName || "-",
          NIK_Ibu: m.motherNik || "-",
          Thn_Lahir_Ibu: m.motherBirthYear || "-",
          Pendidikan_Ibu: m.motherEducation || "-",
          Pekerjaan_Ibu: m.motherOccupation || "-",
          Penghasilan_Ibu: m.motherIncome || "-",
          Nama_Wali: m.guardianName || "-",
          NIK_Wali: m.guardianNik || "-",
          No_HP_Wali: m.guardianPhone || "-",
          Pekerjaan_Wali: m.guardianOccupation || "-",
          No_HP_Siswa: m.phone || "-",
          No_HP_Ortu: m.parentPhone || "-",
          Email: m.email || "-",
          Alamat_Jalan: m.address || "-",
          RT_RW: `${m.rt || "-"}/${m.rw || "-"}`,
          Kelurahan_Desa: m.village || "-",
          Kecamatan: m.district || "-",
          Kode_Pos: m.postalCode || "-",
          Golongan_Darah: m.bloodType || "-",
          Riwayat_Penyakit: m.medicalHistory || m.disease || "-",
          Kelainan_Fisik: m.abnormality || "-",
          Penerima_Beasiswa: formatBoolean(m.isScholarship, "Ya", "Tidak"),
          Status_Siswa: getStatusText(m.status),
          Status_Aktif: formatBoolean(m.isActive),
          Unit_Sekolah: m.unitSekolah?.name || "-",
          Tingkat: subKelas?.tingkat?.name || "-",
          Jurusan: subKelas?.jurusan?.name || "-",
          Rombel: subKelas?.name || "-",
          Tahun_Ajaran: rk?.tahunAkademik?.name || "-",
          No_Formulir: m.formNo || "-",
          Username: m.username || "-",
          Terdaftar_Pada: formatDate(m.createdAt)
        }
      })
      rawData["murid"] = muridData

      // 1.2 Data Guru (Fix bidangStudi include & statusKepegawaian)
      const guruData = await prisma.guru.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true,
          bidangStudi: true
        },
        orderBy: { name: 'asc' }
      })
      backupData["Data_Guru"] = guruData.map((g: any, index: number) => ({
        "No.": index + 1,
        NIP: g.nip || "-",
        Nama_Guru: g.name,
        Jenis_Kelamin: g.gender || "-",
        No_HP: g.phone || "-",
        Email: g.email || "-",
        Unit_Sekolah: g.unitSekolah?.name || "-",
        Bidang_Studi: g.bidangStudi?.name || "-",
        Status_Kepegawaian: g.statusKepegawaian || "-",
        Pendidikan_Terakhir: g.pendidikan || "-",
        Rekening_Bank: g.bankName ? `${g.bankName} - ${g.bankAccount} (a.n ${g.bankAccountName})` : "-",
        Status_Aktif: formatBoolean(g.isActive)
      }))
      rawData["guru"] = guruData

      // 1.3 Daftar Rombel (SubKelas)
      const rombelData = await prisma.subKelas.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true,
          tingkat: true,
          jurusan: true,
          tahunAkademik: true,
          waliKelasGuru: true
        },
        orderBy: { name: 'asc' }
      })
      backupData["Daftar_Rombel"] = rombelData.map((r: any, index: number) => ({
        "No.": index + 1,
        Nama_Rombel: r.name,
        Tingkat: r.tingkat?.name || "-",
        Jurusan: r.jurusan?.name || "-",
        Tahun_Akademik: r.tahunAkademik?.name || "-",
        Wali_Kelas: r.waliKelasGuru?.name || r.waliKelas || "-",
        No_HP_Wali_Kelas: r.waliKelasGuru?.phone || r.waliKelasPhone || "-",
        Unit_Sekolah: r.unitSekolah?.name || "-"
      }))
      rawData["subKelas"] = rombelData

      // 1.4 Tahun Akademik
      const tahunAkademikData = await prisma.tahunAkademik.findMany({
        orderBy: { createdAt: 'desc' }
      })
      backupData["Tahun_Akademik"] = tahunAkademikData.map((t: any, index: number) => ({
        "No.": index + 1,
        ID_Tahun: t.id,
        Nama_Tahun_Akademik: t.name,
        Status_Aktif: formatBoolean(t.isActive),
        Status_Terhapus: formatBoolean(t.isDeleted, "Terhapus", "Aktif"),
        Dibuat_Pada: formatDate(t.createdAt)
      }))
      rawData["tahunAkademik"] = tahunAkademikData

      // 1.5 Jenjang Tingkat
      const tingkatData = await prisma.tingkat.findMany({
        where: unitFilter,
        include: { unitSekolah: true },
        orderBy: [{ unitSekolahId: 'asc' }, { order: 'asc' }]
      })
      backupData["Jenjang_Tingkat"] = tingkatData.map((tk: any, index: number) => ({
        "No.": index + 1,
        ID_Tingkat: tk.id,
        Nama_Tingkat: tk.name,
        Urutan_Sortir: tk.order,
        Unit_Sekolah: tk.unitSekolah?.name || "-"
      }))
      rawData["tingkat"] = tingkatData

      // 1.6 Master Jurusan
      const jurusanData = await prisma.jurusan.findMany({
        where: unitFilter,
        include: { unitSekolah: true },
        orderBy: { code: 'asc' }
      })
      backupData["Master_Jurusan"] = jurusanData.map((j: any, index: number) => ({
        "No.": index + 1,
        ID_Jurusan: j.id,
        Kode_Jurusan: j.code,
        Nama_Jurusan: j.name,
        Unit_Sekolah: j.unitSekolah?.name || "-"
      }))
      rawData["jurusan"] = jurusanData

      // 1.7 Bidang Studi
      const bidangStudiData = await prisma.bidangStudi.findMany({
        where: unitFilter,
        include: { unitSekolah: true },
        orderBy: { name: 'asc' }
      })
      backupData["Bidang_Studi"] = bidangStudiData.map((b: any, index: number) => ({
        "No.": index + 1,
        ID_Bidang_Studi: b.id,
        Nama_Bidang_Studi: b.name,
        Unit_Sekolah: b.unitSekolah?.name || "-"
      }))
      rawData["bidangStudi"] = bidangStudiData

      // 1.8 Riwayat Kelas
      const riwayatKelasData = await prisma.riwayatKelas.findMany({
        where: isGlobal ? {} : { murid: { unitSekolahId: unitId } },
        include: {
          murid: { include: { unitSekolah: true } },
          subKelas: true,
          tahunAkademik: true
        },
        orderBy: { createdAt: 'desc' }
      })
      backupData["Riwayat_Kelas"] = riwayatKelasData.map((rk: any, index: number) => ({
        "No.": index + 1,
        ID_Riwayat: rk.id,
        NIS: rk.murid?.nis || "-",
        Nama_Siswa: rk.murid?.name || "-",
        Unit_Sekolah: rk.murid?.unitSekolah?.name || "-",
        Rombel: rk.subKelas?.name || "-",
        Tahun_Akademik: rk.tahunAkademik?.name || "-",
        Status_Kelas_Saat_Ini: formatBoolean(rk.isCurrent, "Ya", "Tidak"),
        Tanggal_Penempatan: formatDate(rk.createdAt)
      }))
      rawData["riwayatKelas"] = riwayatKelasData
    }

    // ==========================================
    // 2. MODUL DATA MASTER KEUANGAN (3 Model)
    // ==========================================
    if (selectedModules.includes("keuangan")) {
      // 2.1 Bagan Akun COA (Fix kode, nama, subKlasifikasi.nama, klasifikasi.nama)
      const akunData = await prisma.akunDetail.findMany({
        where: unitFilter,
        include: {
          subKlasifikasi: { include: { klasifikasi: true } },
          unitSekolah: true
        },
        orderBy: { kode: 'asc' }
      })
      backupData["Bagan_Akun"] = akunData.map((a: any, index: number) => ({
        "No.": index + 1,
        Kode_Akun: a.kode,
        Nama_Akun: a.nama,
        Sub_Klasifikasi: a.subKlasifikasi?.nama || "-",
        Kategori_Utama: a.subKlasifikasi?.klasifikasi?.nama || "-",
        Kas_Atau_Bank: formatBoolean(a.isKasBank, "Ya", "Bukan"),
        Komponen_SPP: formatBoolean(a.isSPP, "Ya", "Bukan"),
        Status_Aktif: formatBoolean(a.isActive),
        Unit_Sekolah: a.unitSekolah?.name || "Global (Semua Unit)"
      }))
      rawData["akunDetail"] = akunData

      // 2.2 Klasifikasi Akun
      const klasifikasiData = await prisma.klasifikasiAkun.findMany({
        where: unitFilter,
        include: { unitSekolah: true },
        orderBy: { kode: 'asc' }
      })
      backupData["Klasifikasi_Akun"] = klasifikasiData.map((ka: any, index: number) => ({
        "No.": index + 1,
        Kode_Klasifikasi: ka.kode,
        Nama_Klasifikasi: ka.nama,
        Unit_Sekolah: ka.unitSekolah?.name || "Global"
      }))
      rawData["klasifikasiAkun"] = klasifikasiData

      // 2.3 Sub-Klasifikasi Akun
      const subKlasifikasiData = await prisma.subKlasifikasiAkun.findMany({
        where: unitFilter,
        include: {
          klasifikasi: true,
          unitSekolah: true
        },
        orderBy: { kode: 'asc' }
      })
      backupData["SubKlasifikasi_Akun"] = subKlasifikasiData.map((ska: any, index: number) => ({
        "No.": index + 1,
        Kode_Sub_Klasifikasi: ska.kode,
        Nama_Sub_Klasifikasi: ska.nama,
        Klasifikasi_Induk: `${ska.klasifikasi?.kode || "-"} - ${ska.klasifikasi?.nama || "-"}`,
        Unit_Sekolah: ska.unitSekolah?.name || "Global"
      }))
      rawData["subKlasifikasiAkun"] = subKlasifikasiData
    }

    // ==========================================
    // 3. MODUL ARUS KAS (TRANSAKSI JURNAL) (2 Model)
    // ==========================================
    if (selectedModules.includes("arus_kas")) {
      const transaksiData = await prisma.transaksi.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true,
          detail: {
            include: { akun: true }
          },
          pembuat: true,
          penerima: true,
          divisi: true
        },
        orderBy: { tanggal: 'asc' }
      })

      const transaksiExcel: any[] = []
      let kasIndex = 1
      transaksiData.forEach((t: any) => {
        t.detail.forEach((d: any) => {
          transaksiExcel.push({
            "No.": kasIndex++,
            No_Referensi: t.noReferensi,
            No_Formulir: t.noFormulir || "-",
            Tanggal: formatDate(t.tanggal),
            Jenis_Transaksi: t.jenis === "KAS_MASUK" ? "Kas Masuk" : "Kas Keluar",
            Sumber: t.sumber || "MANUAL",
            Keterangan: t.deskripsi,
            Penyetor_Pihak_Ketiga: t.namaPihakKetiga || "-",
            Kode_Akun: d.akun?.kode || "-",
            Nama_Akun: d.akun?.nama || "-",
            Posisi: d.posisi,
            Debit: d.posisi === "DEBIT" ? formatRupiah(d.nilai) : formatRupiah(0),
            Kredit: d.posisi === "KREDIT" ? formatRupiah(d.nilai) : formatRupiah(0),
            Unit_Sekolah: t.unitSekolah?.name || "Global",
            Divisi: t.divisi?.name || "-",
            Operator_Pembuat: t.pembuat?.name || "-",
            Operator_Penerima: t.penerima?.name || "-",
            Status_Jurnal: t.status,
            Status_Revisi: formatBoolean(t.isEdited, "Diedit", "Asli"),
            Alasan_Revisi: t.editReason || "-"
          })
        })
      })
      backupData["Arus_Kas"] = transaksiExcel
      rawData["transaksi"] = transaksiData
    }

    // ==========================================
    // 4. MODUL TAGIHAN & PEMBAYARAN (2 Model)
    // ==========================================
    if (selectedModules.includes("tagihan")) {
      // 4.1 Daftar Tagihan
      const tagihanData = await prisma.tagihan.findMany({
        where: isGlobal ? {} : { murid: { unitSekolahId: unitId } },
        include: {
          murid: { include: { unitSekolah: true } },
          akun: true,
          tahunAkademik: true
        },
        orderBy: { createdAt: 'desc' }
      })
      backupData["Daftar_Tagihan"] = tagihanData.map((t: any, index: number) => ({
        "No.": index + 1,
        ID_Tagihan: t.id,
        Nama_Tagihan: t.namaTagihan || t.akun?.nama || "-",
        Komponen_Biaya: t.akun?.nama || "-",
        NIS_Siswa: t.murid?.nis || "-",
        Nama_Siswa: t.murid?.name || "-",
        Unit_Sekolah: t.murid?.unitSekolah?.name || "-",
        Tahun_Akademik: t.tahunAkademik?.name || "-",
        Nominal_Tagihan: formatRupiah(t.jumlah),
        Sisa_Tagihan: formatRupiah(t.sisaTagihan),
        Status_Lunas: getStatusText(t.status),
        Keterangan: t.keterangan || "-",
        Dibuat_Pada: formatDate(t.createdAt)
      }))
      rawData["tagihan"] = tagihanData

      // 4.2 Histori Pembayaran (Fix jumlahDibayar, potongan, kategoriPotongan)
      const pembayaranData = await prisma.pembayaranTagihanDetail.findMany({
        where: isGlobal ? {} : { transaksi: { unitSekolahId: unitId } },
        include: {
          tagihan: {
            include: {
              akun: true,
              murid: { include: { unitSekolah: true } }
            }
          },
          transaksi: { include: { pembuat: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
      backupData["Histori_Pembayaran"] = pembayaranData.map((p: any, index: number) => ({
        "No.": index + 1,
        No_Bukti_Transaksi: p.transaksi?.noReferensi || "-",
        Tanggal_Bayar: formatDateTime(p.createdAt),
        NIS_Siswa: p.tagihan?.murid?.nis || "-",
        Nama_Siswa: p.tagihan?.murid?.name || "-",
        Tagihan: p.tagihan?.namaTagihan || p.tagihan?.akun?.nama || "-",
        Nominal_Bayar: formatRupiah(p.jumlahDibayar),
        Potongan_Diskon: formatRupiah(p.potongan || 0),
        Kategori_Potongan: p.kategoriPotongan || "-",
        Unit_Sekolah: p.tagihan?.murid?.unitSekolah?.name || "-",
        Operator_Kasir: p.transaksi?.pembuat?.name || "-"
      }))
      rawData["pembayaranTagihanDetail"] = pembayaranData
    }

    // ==========================================
    // 5. MODUL SISTEM & AKSES (5 Model)
    // ==========================================
    if (selectedModules.includes("sistem")) {
      // 5.1 Pengguna Sistem (Masking password hash, sertakan status lockout & security)
      const usersData = await prisma.pengguna.findMany({
        include: { unitSekolah: true, divisi: true },
        orderBy: { name: 'asc' }
      })
      backupData["Pengguna_Sistem"] = usersData.map((u: any, index: number) => ({
        "No.": index + 1,
        ID_Pengguna: u.id,
        Nama: u.name,
        Email: u.email,
        Role: u.role,
        Unit_Tugas: u.unitSekolah?.name || "Global (Semua Unit)",
        Divisi: u.divisi?.name || "-",
        Status_Aktif: formatBoolean(u.isActive),
        Percobaan_Gagal: u.failedLoginAttempts || 0,
        Terkunci_Sampai: u.lockedUntil ? formatDateTime(u.lockedUntil) : "-",
        Wajib_Ganti_Password: formatBoolean(u.mustChangePassword, "Ya", "Tidak"),
        Terakhir_Aktif: u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "-",
        Password_Hash: "[DISENSOR_DEMI_KEAMANAN]"
      }))
      // Sanitasi password pada rawData JSON
      rawData["pengguna"] = usersData.map((u: any) => ({
        ...u,
        password: "[DISENSOR_DEMI_KEAMANAN]"
      }))

      // 5.2 Master Unit Sekolah
      const unitData = await prisma.unitSekolah.findMany({
        orderBy: { level: 'asc' }
      })
      backupData["Master_Unit_Sekolah"] = unitData.map((u: any, index: number) => ({
        "No.": index + 1,
        Kode_Unit: u.id,
        Nama_Unit: u.name,
        Jenjang: u.level,
        Alamat: u.address || "-",
        No_Telepon: u.phone || "-",
        Email: u.email || "-",
        Website: u.website || "-",
        Kepala_Sekolah: u.namaKepalaSekolah || "-",
        NIP_Kepala_Sekolah: u.nipKepalaSekolah || "-",
        Kepala_Tata_Usaha: u.namaKepalaTU || "-",
        NIP_Kepala_TU: u.nipKepalaTU || "-",
        Bendahara_Unit: u.namaBendaharaUnit || "-",
        Kota_Penandatangan: u.kotaPenandatangan || "-",
        Status_Aktif: formatBoolean(u.isActive)
      }))
      rawData["unitSekolah"] = unitData

      // 5.3 Master Divisi
      const divisiData = await prisma.divisi.findMany({
        orderBy: { name: 'asc' }
      })
      backupData["Master_Divisi"] = divisiData.map((d: any, index: number) => ({
        "No.": index + 1,
        ID_Divisi: d.id,
        Nama_Divisi: d.name,
        Deskripsi: d.description || "-",
        Dibuat_Pada: formatDate(d.createdAt)
      }))
      rawData["divisi"] = divisiData

      // 5.4 Pengaturan Yayasan
      const pengaturanData = await prisma.pengaturan.findUnique({
        where: { id: "GLOBAL" }
      })
      backupData["Pengaturan_Yayasan"] = pengaturanData ? [
        {
          ID_Pengaturan: pengaturanData.id,
          Nama_Yayasan: pengaturanData.namaYayasan,
          Alamat_Yayasan: pengaturanData.alamat,
          Telepon: pengaturanData.telepon || "-",
          Email: pengaturanData.email || "-",
          Website: pengaturanData.website || "-",
          Kota_Penandatangan: pengaturanData.kotaPenandatangan || "-",
          Pimpinan_Yayasan: pengaturanData.namaPimpinanYayasan || "-",
          Jabatan_Pimpinan: pengaturanData.jabatanPimpinanYayasan || "-",
          Bendahara_Yayasan: pengaturanData.namaBendaharaYayasan || "-",
          Prefix_Kas_Masuk: pengaturanData.prefixKasMasuk,
          Prefix_Kas_Keluar: pengaturanData.prefixKasKeluar,
          Rekening_Bank_JSON: pengaturanData.rekeningBank || "-",
          Catatan_Kwitansi: pengaturanData.catatanKwitansi || "-"
        }
      ] : [{ Info: "Pengaturan belum dikonfigurasi" }]
      rawData["pengaturan"] = pengaturanData

      // 5.5 Audit Log Aktivitas (Maksimal 3000 log terbaru)
      const logData = await prisma.logAktivitas.findMany({
        include: { pengguna: true },
        orderBy: { createdAt: 'desc' },
        take: 3000
      })
      backupData["Audit_Log_Aktivitas"] = logData.map((l: any, index: number) => ({
        "No.": index + 1,
        Waktu: formatDateTime(l.createdAt),
        Pengguna: l.pengguna?.name || "Sistem",
        Email_Pengguna: l.pengguna?.email || "-",
        Modul: l.modul,
        Aksi: l.aksi,
        Deskripsi_Aktivitas: l.keterangan
      }))
      rawData["logAktivitas"] = logData
    }

    return { success: true, data: backupData, rawData }
  } catch (error: any) {
    console.error("Backup Error:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat memproses backup data." }
  }
}

