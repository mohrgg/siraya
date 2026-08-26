"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Helper Formatters
const formatRupiah = (angka: number) => {
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
    const isGlobal = !unitId || unitId === "GLOBAL"
    const unitFilter = isGlobal ? {} : { unitSekolahId: unitId }

    // 1. DATA AKADEMIK
    if (selectedModules.includes("akademik")) {
      // Murid
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
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      backupData["Data_Murid"] = muridData.map((m: any, index: number) => {
        const subKelas = m.riwayatKelas?.[0]?.subKelas
        return {
          "No.": index + 1,
          NIS: m.nis || "-",
          NISN: m.nisn || "-",
          Nama_Siswa: m.name,
          Jenis_Kelamin: m.gender || "-",
          Agama: m.religion || "-",
          Tempat_Lahir: m.birthPlace || "-",
          Tanggal_Lahir: formatDate(m.birthDate),
          Unit_Sekolah: m.unitSekolah?.name || "-",
          Tingkat: subKelas?.tingkat?.name || "-",
          Jurusan: subKelas?.jurusan?.name || "-",
          Rombel: subKelas?.name || "-",
          Alamat: m.address || "-",
          No_Telp_Ortu: m.parentPhone || "-",
          Status: getStatusText(m.status)
        }
      })

      // Guru
      const guruData = await prisma.guru.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true
        }
      })
      backupData["Data_Guru"] = guruData.map((g: any, index: number) => ({
        "No.": index + 1,
        NIP: g.nip || "-",
        Nama_Guru: g.name,
        Email: g.email || "-",
        Unit_Sekolah: g.unitSekolah?.name || "-",
        Bidang_Studi: g.bidangStudi || "-",
        Pendidikan: g.pendidikan || "-",
        Status_Pegawai: g.statusPegawai || "-",
        Status_Aktif: formatBoolean(g.isActive)
      }))

      // Kelas & Master Akademik lainnya
      const rombelData = await prisma.subKelas.findMany({
        where: unitFilter,
        include: { unitSekolah: true, tingkat: true, jurusan: true }
      })
      backupData["Daftar_Rombel"] = rombelData.map((r: any, index: number) => ({
        "No.": index + 1,
        Nama_Rombel: r.name,
        Tingkat: r.tingkat?.name || "-",
        Jurusan: r.jurusan?.name || "-",
        Unit_Sekolah: r.unitSekolah?.name || "-"
      }))
    }

    // 2. DATA MASTER KEUANGAN
    if (selectedModules.includes("keuangan")) {
      // Akun COA (Chart of Accounts)
      const akunData = await prisma.akunDetail.findMany({
        where: unitFilter,
        include: {
          subKlasifikasi: { include: { klasifikasi: true } },
          unitSekolah: true
        }
      })
      backupData["Bagan_Akun"] = akunData.map((a: any, index: number) => ({
        "No.": index + 1,
        Kode_Akun: a.code,
        Nama_Akun: a.name,
        Sub_Klasifikasi: a.subKlasifikasi?.name || "-",
        Kategori_Utama: a.subKlasifikasi?.klasifikasi?.name || "-",
        Unit_Sekolah: a.unitSekolah?.name || "Global (Semua Unit)"
      }))
    }

    // 3. ARUS KAS (TRANSAKSI JURNAL)
    if (selectedModules.includes("arus_kas")) {
      const transaksiData = await prisma.transaksi.findMany({
        where: unitFilter,
        include: {
          unitSekolah: true,
          detail: {
            include: { akun: true }
          },
          pembuat: true
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
            Tanggal: formatDate(t.tanggal),
            Jenis_Transaksi: t.jenis === "KAS_MASUK" ? "Kas Masuk" : "Kas Keluar",
            Keterangan: t.deskripsi,
            Kode_Akun: d.akun?.kode || "-",
            Nama_Akun: d.akun?.nama || "-",
            Debit: d.posisi === "DEBIT" ? formatRupiah(d.nilai) : formatRupiah(0),
            Kredit: d.posisi === "KREDIT" ? formatRupiah(d.nilai) : formatRupiah(0),
            Unit_Sekolah: t.unitSekolah?.name || "Global",
            Operator: t.pembuat?.name || "-"
          })
        })
      })
      backupData["Arus_Kas"] = transaksiExcel
    }

    // 4. DATA TAGIHAN & PEMBAYARAN
    if (selectedModules.includes("tagihan")) {
      const tagihanData = await prisma.tagihan.findMany({
        where: isGlobal ? {} : { murid: { unitSekolahId: unitId } },
        include: {
          murid: { include: { unitSekolah: true } },
          akun: true,
          tahunAkademik: true
        }
      })
      backupData["Daftar_Tagihan"] = tagihanData.map((t: any, index: number) => ({
        "No.": index + 1,
        Nama_Tagihan: t.akun?.nama || "-",
        Siswa: t.murid?.name || "-",
        Nominal: formatRupiah(t.jumlah),
        Sisa_Tagihan: formatRupiah(t.sisaTagihan),
        Akun_Tujuan: t.akun?.nama || "-",
        Unit_Sekolah: t.murid?.unitSekolah?.name || "-",
        Status: getStatusText(t.status)
      }))

      // Detail Pembayaran Siswa
      const pembayaranData = await prisma.pembayaranTagihanDetail.findMany({
        where: isGlobal ? {} : { transaksi: { unitSekolahId: unitId } },
        include: {
          tagihan: { include: { akun: true, murid: { include: { unitSekolah: true } } } },
          transaksi: { include: { pembuat: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
      backupData["Histori_Pembayaran"] = pembayaranData.map((p: any, index: number) => ({
        "No.": index + 1,
        No_Referensi: p.transaksi?.noReferensi || "-",
        Tanggal_Bayar: formatDate(p.createdAt),
        NIS_Siswa: p.tagihan?.murid?.nis || "-",
        Nama_Siswa: p.tagihan?.murid?.name || "-",
        Tagihan: p.tagihan?.akun?.nama || "-",
        Nominal_Bayar: formatRupiah(p.nilaiPembayaran),
        Unit_Sekolah: p.tagihan?.murid?.unitSekolah?.name || "-",
        Operator: p.transaksi?.pembuat?.name || "-"
      }))
    }

    // 5. SISTEM & AKSES
    if (selectedModules.includes("sistem")) {
      const usersData = await prisma.pengguna.findMany({
        include: { unitSekolah: true, divisi: true }
      })
      backupData["Pengguna_Sistem"] = usersData.map((u: any, index: number) => ({
        "No.": index + 1,
        Nama: u.name,
        Email: u.email,
        Role: u.role,
        Unit_Tugas: u.unitSekolah?.name || "Global",
        Divisi: u.divisi?.name || "-",
        Status: formatBoolean(u.isActive),
        Password_Hash: "[DISENSOR]" // Keamanan
      }))

      const unitData = await prisma.unitSekolah.findMany()
      backupData["Master_Unit_Sekolah"] = unitData.map((u: any, index: number) => ({
        "No.": index + 1,
        Kode_Unit: u.id,
        Nama_Unit: u.name,
        Alamat: u.address || "-",
        Kepala_Sekolah: u.namaKepalaSekolah || "-"
      }))
    }

    return { success: true, data: backupData }
  } catch (error: any) {
    console.error("Backup Error:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat memproses backup data." }
  }
}
