"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getLaporanPemasukanPengeluaran(startDate: string, endDate: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  // set end to end of day
  end.setHours(23, 59, 59, 999)

  const user = session.user as any
  const unitSekolahId = user.unitSekolahId

  const whereClause: any = {
    tanggal: {
      gte: start,
      lte: end
    },
    status: "POSTED"
  }

  if (unitSekolahId) {
    whereClause.unitSekolahId = unitSekolahId
  }

  const transaksiDetails = await prisma.transaksiDetail.findMany({
    where: {
      transaksi: whereClause
    },
    include: {
      akun: true,
      transaksi: true
    }
  })

  // Group by akun
  const pendapatan: Record<string, { kode: string, nama: string, total: number }> = {}
  const pengeluaran: Record<string, { kode: string, nama: string, total: number }> = {}

  let totalPendapatan = 0
  let totalPengeluaran = 0

  transaksiDetails.forEach(detail => {
    // KAS_MASUK means income (debit to bank, credit to income account usually)
    // Actually, in this app:
    // If it's KAS_MASUK, the income account is credited.
    // Wait, let's just use the `transaksi.jenis` to simplify, and find the non-KasBank account.
    if (detail.akun.isKasBank) return // We only want the income/expense account, not the cash/bank account.

    const akunId = detail.akun.id
    if (detail.transaksi.jenis === "KAS_MASUK") {
      if (!pendapatan[akunId]) {
        pendapatan[akunId] = { kode: detail.akun.kode, nama: detail.akun.nama, total: 0 }
      }
      pendapatan[akunId].total += detail.nilai
      totalPendapatan += detail.nilai
    } else if (detail.transaksi.jenis === "KAS_KELUAR") {
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

export async function getLaporanTunggakanSiswa() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  const user = session.user as any
  const unitSekolahId = user.unitSekolahId

  const whereClause: any = {
    sisaTagihan: { gt: 0 }
  }

  const tagihanList = await prisma.tagihan.findMany({
    where: whereClause,
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

  // Filter out students not in the user's unitSekolah if restricted
  const filteredTagihan = unitSekolahId 
    ? tagihanList.filter(t => t.murid.unitSekolahId === unitSekolahId)
    : tagihanList

  return filteredTagihan.map(t => ({
    id: t.id,
    tanggalBuat: t.createdAt.toISOString(),
    nis: t.murid.nis,
    namaSiswa: t.murid.name,
    namaTagihan: t.akun.nama,
    unitSekolah: t.murid.unitSekolah.name,
    rombel: t.murid.riwayatKelas?.[0]?.subKelas?.name || "-",
    nominal: t.jumlah,
    dibayar: t.jumlah - t.sisaTagihan,
    sisa: t.sisaTagihan
  }))
}
