"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getLaporanPemasukanPengeluaran(startDate: string, endDate: string, filterUnitId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T23:59:59.999Z`)

  const user = session.user as any
  const restrictedUnitId = user.unitSekolahId
  const finalUnitId = restrictedUnitId || filterUnitId

  const whereClause: any = {
    tanggal: {
      gte: start,
      lte: end
    },
    status: "POSTED"
  }

  if (finalUnitId) {
    whereClause.unitSekolahId = finalUnitId
  }

  const transaksiDetails = await prisma.transaksiDetail.findMany({
    where: {
      transaksi: whereClause
    },
    include: {
      akun: {
        include: {
          subKlasifikasi: {
            include: {
              klasifikasi: true
            }
          }
        }
      },
      transaksi: true
    }
  })

  // Group by akun
  const pendapatan: Record<string, { kode: string, nama: string, total: number }> = {}
  const pengeluaran: Record<string, { kode: string, nama: string, total: number }> = {}

  let totalPendapatan = 0
  let totalPengeluaran = 0

  transaksiDetails.forEach(detail => {
    const klasifikasiKode = detail.akun.subKlasifikasi?.klasifikasi?.kode

    // Abaikan akun Kas/Bank atau akun Neraca Riil (Harta 1, Kewajiban 2, Ekuitas 3)
    // Laporan ini khusus akun Nominal (Pendapatan 4 dan Beban 5)
    if (klasifikasiKode === "1" || klasifikasiKode === "2" || klasifikasiKode === "3") return
    if (detail.akun.isKasBank && (!klasifikasiKode || klasifikasiKode === "1")) return

    const akunId = detail.akun.id

    // Kaidah Akuntansi:
    // - Posisi KREDIT pada akun nominal / Kode 4 = Pendapatan / Pemasukan
    // - Posisi DEBIT pada akun nominal / Kode 5 = Beban / Pengeluaran (termasuk Beban Beasiswa & Potongan Siswa)
    if (detail.posisi === "KREDIT" || klasifikasiKode === "4") {
      if (!pendapatan[akunId]) {
        pendapatan[akunId] = { kode: detail.akun.kode, nama: detail.akun.nama, total: 0 }
      }
      pendapatan[akunId].total += detail.nilai
      totalPendapatan += detail.nilai
    } else if (detail.posisi === "DEBIT" || klasifikasiKode === "5") {
      if (!pengeluaran[akunId]) {
        pengeluaran[akunId] = { kode: detail.akun.kode, nama: detail.akun.nama, total: 0 }
      }
      pengeluaran[akunId].total += detail.nilai
      totalPengeluaran += detail.nilai
    }
  })

  return {
    pendapatan: Object.values(pendapatan).sort((a, b) => a.kode.localeCompare(b.kode)),
    totalPendapatan,
    pengeluaran: Object.values(pengeluaran).sort((a, b) => a.kode.localeCompare(b.kode)),
    totalPengeluaran
  }
}

export async function getLaporanTunggakanSiswa(filterUnitId?: string, filterTingkatId?: string, filterSubKelasId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  const user = session.user as any
  const restrictedUnitId = user.unitSekolahId
  const finalUnitId = restrictedUnitId || filterUnitId

  const tagihanWhereClause: any = {}

  const muridWhereClause: any = {}
  if (finalUnitId) muridWhereClause.unitSekolahId = finalUnitId

  if (Object.keys(muridWhereClause).length > 0) {
    tagihanWhereClause.murid = muridWhereClause
  }

  const tagihanList = await prisma.tagihan.findMany({
    where: tagihanWhereClause,
    include: {
      murid: {
        include: {
          unitSekolah: true,
          riwayatKelas: {
            include: { subKelas: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      },
      akun: true
    },
    orderBy: { createdAt: 'desc' }
  })

  let filteredTagihan = tagihanList
  
  if (filterTingkatId) {
    filteredTagihan = filteredTagihan.filter(t => t.murid.riwayatKelas?.[0]?.subKelas?.tingkatId === filterTingkatId)
  }
  
  if (filterSubKelasId) {
    filteredTagihan = filteredTagihan.filter(t => t.murid.riwayatKelas?.[0]?.subKelasId === filterSubKelasId)
  }

  return filteredTagihan.map(t => ({
    id: t.id,
    tanggalBuat: t.createdAt.toISOString(),
    muridId: t.muridId,
    nis: t.murid.nis,
    namaSiswa: t.murid.name,
    kategori: t.akun.nama,
    isSPP: t.akun.isSPP,
    deskripsiTagihan: t.namaTagihan,
    unitSekolah: t.murid.unitSekolah.name,
    rombel: t.murid.riwayatKelas?.[0]?.subKelas?.name || "-",
    nominal: t.jumlah,
    dibayar: t.jumlah - t.sisaTagihan,
    sisa: t.sisaTagihan
  }))
}

export async function getMutasiBank(startDate: string, endDate: string, akunDetailId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (!akunDetailId) return { saldoAwal: 0, mutasi: [], saldoAkhir: 0 }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const user = session.user as any
  const restrictedUnitId = user.unitSekolahId

  // Verify account ownership
  const akun = await prisma.akunDetail.findUnique({ where: { id: akunDetailId } })
  if (!akun) throw new Error("Akun tidak ditemukan")
  if (restrictedUnitId && akun.unitSekolahId !== restrictedUnitId) {
    throw new Error("Akses ditolak")
  }

  // 1. Calculate Saldo Awal (sebelum start date)
  const mutasiSebelumnya = await prisma.transaksiDetail.groupBy({
    by: ['posisi'],
    where: {
      akunId: akunDetailId,
      transaksi: {
        status: "POSTED",
        tanggal: { lt: start }
      }
    },
    _sum: {
      nilai: true
    }
  })

  let saldoAwal = 0
  mutasiSebelumnya.forEach(m => {
    if (m.posisi === 'DEBIT') saldoAwal += (m._sum.nilai || 0)
    else if (m.posisi === 'KREDIT') saldoAwal -= (m._sum.nilai || 0)
  })

  // 2. Ambil mutasi selama periode
  const mutasi = await prisma.transaksiDetail.findMany({
    where: {
      akunId: akunDetailId,
      transaksi: {
        status: "POSTED",
        tanggal: {
          gte: start,
          lte: end
        }
      }
    },
    include: {
      transaksi: true
    },
    orderBy: [
      { transaksi: { tanggal: 'asc' } },
      { transaksi: { createdAt: 'asc' } }
    ]
  })

  let currentSaldo = saldoAwal
  const mutasiFormatted = mutasi.map(m => {
    const isDebit = m.posisi === "DEBIT"
    const debit = isDebit ? m.nilai : 0
    const kredit = !isDebit ? m.nilai : 0
    currentSaldo = currentSaldo + debit - kredit

    return {
      id: m.id,
      tanggal: m.transaksi.tanggal.toISOString(),
      noReferensi: m.transaksi.noReferensi,
      keterangan: m.deskripsi || m.transaksi.deskripsi,
      pihakKetiga: m.transaksi.namaPihakKetiga || "-",
      debit,
      kredit,
      saldo: currentSaldo
    }
  })

  return {
    saldoAwal,
    mutasi: mutasiFormatted,
    saldoAkhir: currentSaldo
  }
}
