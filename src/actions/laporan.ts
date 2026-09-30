"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface AkunLaporanItem {
  kode: string
  nama: string
  total: number
}

function parseAkunPendapatan(item: AkunLaporanItem) {
  const origNama = (item.nama || "").trim()
  const upperNama = origNama.toUpperCase()
  const kode = (item.kode || "").trim()

  // 1. Ekstrak tahun jika ada (misal 2024, 2025, 2026, 2027)
  const matchYear = upperNama.match(/\b(20\d{2})\b/)
  const year = matchYear ? parseInt(matchYear[1], 10) : 9999

  // Hapus pola tahun dari string sementara agar tidak mengganggu deteksi angka kelas
  const cleanNamaForLevel = upperNama.replace(/\b20\d{2}\b/g, " ")

  // 2. Ekstrak tingkatan kelas (Romawi / Arab)
  let level = 999
  const romanMap: Record<string, number> = {
    "XII": 12, "XI": 11, "X": 10, "IX": 9, "VIII": 8, "VII": 7,
    "VI": 6, "V": 5, "IV": 4, "III": 3, "II": 2, "I": 1
  }
  for (const [roman, num] of Object.entries(romanMap)) {
    if (new RegExp(`\\b${roman}\\b`).test(cleanNamaForLevel)) {
      level = num
      break
    }
  }
  if (level === 999) {
    const matchArab = cleanNamaForLevel.match(/\b([1-9]|1[0-2])\b/)
    if (matchArab) {
      level = parseInt(matchArab[1], 10)
    }
  }

  // 3. Tentukan kategori / rank prioritas
  let rank = 100
  if (upperNama.includes("SPP") && level !== 999) {
    rank = 10 // SPP per tingkat (X, XI, XII / 1-12)
  } else if (upperNama.includes("SPP")) {
    rank = 20 // SPP tahunan / umum
  } else if (upperNama.includes("PSB") || upperNama.includes("PPDB") || upperNama.includes("PENDAFTARAN") || upperNama.includes("PANGKAL")) {
    rank = 30 // Penerimaan Siswa Baru
  } else if (upperNama.includes("DAFTAR ULANG") || upperNama.includes("REGISTRASI ULANG")) {
    rank = 40 // Daftar Ulang
  } else if (upperNama.includes("BAT") || upperNama.includes("AWAL TAHUN") || upperNama.includes("GEDUNG") || upperNama.includes("SARANA")) {
    rank = 50 // Biaya Awal Tahun / Sarana
  } else if (upperNama.includes("SERAGAM") || upperNama.includes("BUKU") || upperNama.includes("LKS") || upperNama.includes("KEGIATAN") || upperNama.includes("UJIAN") || upperNama.includes("ASESMEN") || upperNama.includes("PRAKERIN") || upperNama.includes("PKL")) {
    rank = 60 // Biaya kesiswaan/akademik
  }

  return { rank, level, year, kode, nama: origNama }
}

function sortLaporanPendapatan(a: AkunLaporanItem, b: AkunLaporanItem): number {
  const pA = parseAkunPendapatan(a)
  const pB = parseAkunPendapatan(b)

  // 1. Urutkan berdasarkan prioritas kategori
  if (pA.rank !== pB.rank) return pA.rank - pB.rank

  // 2. Jika SPP per tingkat, utamakan tingkatan kelas (X -> XI -> XII atau 1 -> 12)
  if (pA.rank === 10 && pA.level !== pB.level) {
    return pA.level - pB.level
  }

  // 3. Urutkan kronologis tahun akademik (2024 -> 2025 -> 2026)
  if (pA.year !== pB.year) {
    return pA.year - pB.year
  }

  // 4. Level kelas untuk pos non-SPP
  if (pA.level !== pB.level) {
    return pA.level - pB.level
  }

  // 5. Fallback alfabetis nama
  const compNama = pA.nama.localeCompare(pB.nama, "id", { numeric: true, sensitivity: "base" })
  if (compNama !== 0) return compNama

  // 6. Fallback kode akun numerik alami
  return pA.kode.localeCompare(pB.kode, undefined, { numeric: true })
}

function sortLaporanPengeluaran(a: AkunLaporanItem, b: AkunLaporanItem): number {
  const compKode = (a.kode || "").localeCompare(b.kode || "", undefined, { numeric: true })
  if (compKode !== 0) return compKode
  return (a.nama || "").localeCompare(b.nama || "", "id", { numeric: true, sensitivity: "base" })
}

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
      transaksi: {
        include: {
          pembayaranTagihan: {
            include: {
              tagihan: {
                include: {
                  akun: true
                }
              }
            }
          }
        }
      }
    }
  })

  // Group by akun
  const pendapatan: Record<string, { kode: string, nama: string, total: number }> = {}
  const pengeluaran: Record<string, { kode: string, nama: string, total: number }> = {}

  let totalPendapatan = 0
  let totalPengeluaran = 0

  function isAkunPotongan(akun: { kode?: string | null; nama?: string | null }) {
    if (!akun) return false
    const kode = akun.kode || ""
    const nama = (akun.nama || "").toLowerCase()
    return kode === "5199" || kode === "5198" || nama.includes("potongan") || nama.includes("beasiswa")
  }

  // Group details by transaksiId to properly handle net cash inflow for transactions with discounts/scholarships
  const trxMap = new Map<string, typeof transaksiDetails>()
  for (const detail of transaksiDetails) {
    const list = trxMap.get(detail.transaksiId) || []
    list.push(detail)
    trxMap.set(detail.transaksiId, list)
  }

  for (const [, details] of trxMap.entries()) {
    const trx = details[0]?.transaksi

    // 1. Alokasikan pendapatan bersih (Net Inflow Kas Riil)
    if (trx?.pembayaranTagihan && trx.pembayaranTagihan.length > 0) {
      // Pembayaran tagihan kesiswaan: ambil kas masuk riil per akun tagihan dari PembayaranTagihanDetail (100% bulat)
      for (const pt of trx.pembayaranTagihan) {
        const akunTagihan = pt.tagihan?.akun
        if (!akunTagihan) continue
        const akunId = akunTagihan.id
        const nilaiNet = pt.jumlahDibayar
        if (nilaiNet <= 0) continue

        if (!pendapatan[akunId]) {
          pendapatan[akunId] = { kode: akunTagihan.kode, nama: akunTagihan.nama, total: 0 }
        }
        pendapatan[akunId].total += nilaiNet
        totalPendapatan += nilaiNet
      }
    } else {
      // Transaksi manual / non-tagihan
      const potonganDetails = details.filter(d => {
        const klasifikasiKode = d.akun.subKlasifikasi?.klasifikasi?.kode
        return (d.posisi === "DEBIT" || klasifikasiKode === "5") && isAkunPotongan(d.akun)
      })
      const totalPotonganTrx = potonganDetails.reduce((sum, d) => sum + d.nilai, 0)

      const pendapatanDetails = details.filter(d => {
        const klasifikasiKode = d.akun.subKlasifikasi?.klasifikasi?.kode
        if (klasifikasiKode === "1" || klasifikasiKode === "2" || klasifikasiKode === "3") return false
        if (d.akun.isKasBank && (!klasifikasiKode || klasifikasiKode === "1")) return false
        return d.posisi === "KREDIT" || klasifikasiKode === "4"
      })
      const totalBrutoPendapatan = pendapatanDetails.reduce((sum, d) => sum + d.nilai, 0)

      let sisaPotongan = totalPotonganTrx
      pendapatanDetails.forEach((d, idx) => {
        const akunId = d.akun.id
        let potonganPorsi = 0
        if (totalPotonganTrx > 0 && totalBrutoPendapatan > 0) {
          if (idx === pendapatanDetails.length - 1) {
            potonganPorsi = sisaPotongan
          } else {
            potonganPorsi = Math.round(totalPotonganTrx * (d.nilai / totalBrutoPendapatan))
            sisaPotongan -= potonganPorsi
          }
        }
        const nilaiNet = Math.max(0, d.nilai - potonganPorsi)
        if (nilaiNet <= 0) return

        if (!pendapatan[akunId]) {
          pendapatan[akunId] = { kode: d.akun.kode, nama: d.akun.nama, total: 0 }
        }
        pendapatan[akunId].total += nilaiNet
        totalPendapatan += nilaiNet
      })
    }

    // 2. Kumpulkan pengeluaran kas riil (Debit / Kode 5) - KECUALIKAN akun potongan non-kas!
    const pengeluaranDetails = details.filter(d => {
      const klasifikasiKode = d.akun.subKlasifikasi?.klasifikasi?.kode
      if (klasifikasiKode === "1" || klasifikasiKode === "2" || klasifikasiKode === "3") return false
      if (d.akun.isKasBank && (!klasifikasiKode || klasifikasiKode === "1")) return false
      if (isAkunPotongan(d.akun)) return false // Eksklusi potongan/beasiswa dari pengeluaran
      return d.posisi === "DEBIT" || klasifikasiKode === "5"
    })

    pengeluaranDetails.forEach(d => {
      const akunId = d.akun.id
      if (!pengeluaran[akunId]) {
        pengeluaran[akunId] = { kode: d.akun.kode, nama: d.akun.nama, total: 0 }
      }
      pengeluaran[akunId].total += d.nilai
      totalPengeluaran += d.nilai
    })
  }

  return {
    pendapatan: Object.values(pendapatan).sort(sortLaporanPendapatan),
    totalPendapatan,
    pengeluaran: Object.values(pengeluaran).sort(sortLaporanPengeluaran),
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
