import prisma from "@/lib/prisma"
import { normalizeStatusKepegawaian } from "@/lib/constants/kepegawaian"

// Helper pengurutan alami jenjang & kelas (1-12 atau I-XII)
function getLevelOrder(str: string): { level: number; suffix: string } {
  const clean = (str || "").trim().toUpperCase()
  // 1. Cek Angka Romawi (XII turun ke I)
  const romanMap: Record<string, number> = {
    'XII': 12, 'XI': 11, 'X': 10, 'IX': 9, 'VIII': 8, 'VII': 7,
    'VI': 6, 'V': 5, 'IV': 4, 'III': 3, 'II': 2, 'I': 1
  }
  for (const [roman, num] of Object.entries(romanMap)) {
    const regex = new RegExp(`\\b${roman}\\b`)
    if (regex.test(clean)) {
      return { level: num, suffix: clean.replace(regex, '').trim() }
    }
  }
  // 2. Cek Angka Arab (1-12)
  const matchNum = clean.match(/\b([1-9]|1[0-2])\b/)
  if (matchNum) {
    return { level: parseInt(matchNum[1], 10), suffix: clean.replace(matchNum[0], '').trim() }
  }
  // 3. Fallback jika tidak ada angka
  return { level: 999, suffix: clean }
}

export function sortSchoolClasses(a: string, b: string): number {
  const parsedA = getLevelOrder(a)
  const parsedB = getLevelOrder(b)
  if (parsedA.level !== parsedB.level) {
    return parsedA.level - parsedB.level
  }
  return parsedA.suffix.localeCompare(parsedB.suffix, 'id', { numeric: true, sensitivity: 'base' })
}

function generateInteractiveChartData(transactions: any[], todayStart: Date, weekStart: Date, monthStart: Date) {
  // Hari Ini (per jam)
  const todayTx = transactions.filter(t => t.tanggal >= todayStart)
  const hariIniMap = new Map<number, number>()
  for (let i = 6; i <= 18; i++) hariIniMap.set(i, 0) // Jam operasional 06:00 - 18:00
  todayTx.forEach(t => {
    const h = t.tanggal.getHours()
    if (h >= 6 && h <= 18) hariIniMap.set(h, (hariIniMap.get(h) || 0) + t.totalNilai)
  })
  const pendapatanHariIniChart = Array.from(hariIniMap.entries()).map(([k, v]) => ({ name: `${String(k).padStart(2, '0')}:00`, value: v }))

  // Minggu Ini (per hari)
  const weekTx = transactions.filter(t => t.tanggal >= weekStart)
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const mingguIniMap = new Map<string, number>(days.map(d => [d, 0]))
  weekTx.forEach(t => {
    let dayIdx = t.tanggal.getDay() // 0 = Sunday, 1 = Monday
    const dStr = dayIdx === 0 ? 'Minggu' : days[dayIdx - 1]
    mingguIniMap.set(dStr, (mingguIniMap.get(dStr) || 0) + t.totalNilai)
  })
  const pendapatanMingguIniChart = Array.from(mingguIniMap.entries()).map(([k, v]) => ({ name: k, value: v }))

  // Bulan Ini (per tanggal)
  const bulanIniMap = new Map<number, number>()
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) bulanIniMap.set(i, 0)
  transactions.forEach(t => {
    const d = t.tanggal.getDate()
    bulanIniMap.set(d, (bulanIniMap.get(d) || 0) + t.totalNilai)
  })
  const pendapatanBulanIniChart = Array.from(bulanIniMap.entries()).map(([k, v]) => ({ name: `${k}`, value: v }))

  // Per Unit (Bulan Ini)
  const unitMap = new Map<string, number>()
  transactions.forEach(t => {
    if (t.unitSekolah?.name) {
      unitMap.set(t.unitSekolah.name, (unitMap.get(t.unitSekolah.name) || 0) + t.totalNilai)
    }
  })
  const pendapatanPerUnitChart = Array.from(unitMap.entries()).map(([k, v]) => ({ name: k, value: v }))

  return { pendapatanHariIniChart, pendapatanMingguIniChart, pendapatanBulanIniChart, pendapatanPerUnitChart }
}

// ==================== STANDAR YAYASAN (GLOBAL) ====================
export async function getYayasanDashboardData(yearId?: string) {
  const [totalPegawai, totalUnit, totalRombel, totalSiswa, totalGuru] = await Promise.all([
    prisma.pengguna.count({ where: { isActive: true } }),
    prisma.unitSekolah.count({ where: { isActive: true } }),
    prisma.subKelas.count({ where: { isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) } }),
    prisma.murid.count({ 
      where: { 
        isActive: true,
        ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
      } 
    }),
    prisma.guru.count({ where: { isDeleted: false, isActive: true } })
  ])

  const unitsRaw = await prisma.unitSekolah.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          murid: { 
            where: { 
              isActive: true,
              ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
            } 
          },
          jurusan: { where: { isDeleted: false } },
          subKelas: { where: { isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) } },
          guru: { where: { isDeleted: false, isActive: true } }
        }
      },
      tingkat: {
        select: {
          name: true,
          subKelas: {
            where: { isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) },
            select: {
              id: true,
              name: true,
              _count: { select: { riwayatKelas: { where: { isCurrent: true, murid: { isActive: true }, ...(yearId ? { tahunAkademikId: yearId } : {}) } } } }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Hitung kolektibilitas per unit
  const tagihanUnitRaw = await prisma.tagihan.findMany({
    select: {
      jumlah: true,
      sisaTagihan: true,
      murid: { select: { unitSekolahId: true } }
    }
  })

  const kolektibilitasMap = new Map<string, { jumlah: number, terbayar: number }>()
  tagihanUnitRaw.forEach(t => {
    const unitId = t.murid?.unitSekolahId
    if (unitId) {
      const data = kolektibilitasMap.get(unitId) || { jumlah: 0, terbayar: 0 }
      data.jumlah += t.jumlah
      data.terbayar += (t.jumlah - t.sisaTagihan)
      kolektibilitasMap.set(unitId, data)
    }
  })

  const unitDistribution = unitsRaw.map(u => {
    const kData = kolektibilitasMap.get(u.id) || { jumlah: 0, terbayar: 0 }
    const kolektibilitas = kData.jumlah > 0 ? Math.round((kData.terbayar / kData.jumlah) * 100) : null
    
    return {
      id: u.id,
      name: u.name,
      total: u._count.murid,
      rombel: u._count.subKelas,
      guru: u._count.guru,
      kolektibilitas,
      tagihanTotal: kData.jumlah,
      tagihanTerbayar: kData.terbayar,
      tagihanSisa: kData.jumlah - kData.terbayar,
      classes: u.tingkat.map(t => ({
        name: t.name,
        total: t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0),
        rombelList: t.subKelas.map(sk => ({
          id: sk.id,
          name: sk.name,
          total: sk._count.riwayatKelas
        }))
      })).filter(t => t.total > 0).sort((a, b) => sortSchoolClasses(a.name, b.name))
    }
  })

  // 2. Demografi Gender Global
  const genderDistribution = await prisma.murid.groupBy({
    by: ['gender'],
    where: { 
      isActive: true,
      ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
    },
    _count: { _all: true }
  })
  
  // Agregasi untuk menghindari duplikasi "Tidak Diketahui" jika ada null dan string kosong
  const genderDataMap = { 'Laki-laki': 0, 'Perempuan': 0, 'Tidak Diketahui': 0 }
  genderDistribution.forEach(g => {
    if (g.gender === 'Laki-laki' || g.gender === 'Perempuan') {
      genderDataMap[g.gender] += g._count._all
    } else {
      genderDataMap['Tidak Diketahui'] += g._count._all
    }
  })
  const genderData = [
    { name: 'Laki-laki', value: genderDataMap['Laki-laki'], color: '#3b82f6' },
    { name: 'Perempuan', value: genderDataMap['Perempuan'], color: '#ec4899' },
    { name: 'Tidak Diketahui', value: genderDataMap['Tidak Diketahui'], color: '#94a3b8' }
  ].filter(g => g.value > 0)

  // 3. Anomali & Data Tidak Lengkap Yayasan
  const unitsWithIncompleteDataRaw = await prisma.unitSekolah.findMany({
    where: { isActive: true },
    select: {
      name: true,
      _count: {
        select: {
          murid: {
            where: {
              isActive: true,
              OR: [
                { nisn: null }, { nisn: '' }, { nisn: '-' }, { nisn: ' - ' },
                { nik: null }, { nik: '' }, { nik: '-' }, { nik: ' - ' },
                { nis: null }, { nis: '' }, { nis: '-' }, { nis: ' - ' }
              ]
            }
          }
        }
      }
    }
  })

  const incompleteData = unitsWithIncompleteDataRaw
    .map(u => ({ unitName: u.name, incompleteCount: u._count.murid }))
    .sort((a, b) => b.incompleteCount - a.incompleteCount)

  const academicYear = yearId 
    ? await prisma.tahunAkademik.findUnique({ where: { id: yearId } })
    : await prisma.tahunAkademik.findFirst({ where: { isActive: true } })

  // ==================== KEUANGAN (FINANCIAL METRICS) ====================
  // 1. Total Kas Global & Piutang (Paralel)
  const [kasMasuk, kasKeluar, tagihan] = await Promise.all([
    prisma.transaksi.aggregate({
      where: { jenis: 'KAS_MASUK', status: 'POSTED' },
      _sum: { totalNilai: true }
    }),
    prisma.transaksi.aggregate({
      where: { jenis: 'KAS_KELUAR', status: 'POSTED' },
      _sum: { totalNilai: true }
    }),
    prisma.tagihan.aggregate({
      _sum: { jumlah: true, sisaTagihan: true }
    })
  ])

  const totalPemasukan = kasMasuk._sum.totalNilai || 0
  const totalPengeluaran = kasKeluar._sum.totalNilai || 0
  const totalKasGlobal = totalPemasukan - totalPengeluaran

  const totalPiutangGlobal = tagihan._sum.sisaTagihan || 0
  const totalTagihanGlobal = tagihan._sum.jumlah || 0
  const totalTerbayarGlobal = totalTagihanGlobal - totalPiutangGlobal
  const kolektibilitas = totalTagihanGlobal > 0 ? Math.round((totalTerbayarGlobal / totalTagihanGlobal) * 100) : 0

  // 3. Trend Arus Kas (6 Bulan Terakhir)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const transactions = await prisma.transaksi.findMany({
    where: { status: 'POSTED', tanggal: { gte: sixMonthsAgo } },
    select: { jenis: true, totalNilai: true, tanggal: true }
  })

  const monthsMap = new Map<string, { month: string, pemasukan: number, pengeluaran: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const mStr = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    monthsMap.set(mStr, { month: mStr, pemasukan: 0, pengeluaran: 0 })
  }

  transactions.forEach(t => {
    const mStr = t.tanggal.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    if (monthsMap.has(mStr)) {
      const data = monthsMap.get(mStr)!
      if (t.jenis === 'KAS_MASUK') data.pemasukan += t.totalNilai
      if (t.jenis === 'KAS_KELUAR') data.pengeluaran += t.totalNilai
    }
  })
  const arusKasTrend = Array.from(monthsMap.values())

  // 4. Top Unit Tunggakan
  const tunggakanRaw = await prisma.tagihan.findMany({
    where: { sisaTagihan: { gt: 0 } },
    select: { sisaTagihan: true, murid: { select: { unitSekolah: { select: { id: true, name: true } } } } }
  })
  
  const unitTunggakanMap = new Map<string, { id: string, name: string, total: number }>()
  tunggakanRaw.forEach(t => {
    const u = t.murid.unitSekolah
    if (u) {
      const existing = unitTunggakanMap.get(u.id) || { id: u.id, name: u.name, total: 0 }
      existing.total += t.sisaTagihan
      unitTunggakanMap.set(u.id, existing)
    }
  })
  
  const topUnitTunggakan = Array.from(unitTunggakanMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // 5. Perbandingan Pendapatan (Hari, Minggu, Bulan Ini)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1)) // Monday
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)

  const pendapatanHariIni = await prisma.transaksi.aggregate({
    where: { jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: todayStart } },
    _sum: { totalNilai: true }
  })
  const pendapatanMingguIni = await prisma.transaksi.aggregate({
    where: { jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: weekStart } },
    _sum: { totalNilai: true }
  })
  const rawMonthTransactions = await prisma.transaksi.findMany({
    where: { jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: monthStart } },
    select: { tanggal: true, totalNilai: true, unitSekolah: { select: { name: true } } }
  })
  const interactiveChartData = generateInteractiveChartData(rawMonthTransactions, todayStart, weekStart, monthStart)

  return {
    usersCount: totalPegawai,
    unitCount: totalUnit,
    rombelCount: totalRombel,
    muridCount: totalSiswa,
    guruCount: totalGuru,
    unitData: unitDistribution,
    genderData,
    incompleteData,
    academicYear,
    // Keuangan Global
    totalKasGlobal, totalPiutangGlobal, kolektibilitas, arusKasTrend, topUnitTunggakan, 
    ...interactiveChartData
  }
}

// Alias untuk menjaga kompabilitas
export const getAdminYayasanData = getYayasanDashboardData;
export const getTuYayasanData = getYayasanDashboardData;

export async function getUnitDashboardData(unitId: string, yearId?: string) {
  const [totalMurid, totalRombel, totalGuru] = await Promise.all([
    prisma.murid.count({ 
      where: { 
        isActive: true, 
        unitSekolahId: unitId,
        ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
      } 
    }),
    prisma.subKelas.count({ where: { unitSekolahId: unitId, isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) } }),
    prisma.guru.count({ where: { unitSekolahId: unitId, isDeleted: false, isActive: true } })
  ])

  // Status Guru: Hanya status valid (abaikan "-", "", "Belum Ditentukan")
  const guruStatusDist = await prisma.guru.groupBy({
    by: ['statusKepegawaian'],
    where: { 
      unitSekolahId: unitId, 
      isDeleted: false, 
      isActive: true,
      statusKepegawaian: {
        notIn: ["-", "", "Belum Ditentukan"]
      }
    },
    _count: { _all: true }
  })
  const statusCountMap = new Map<string, number>()
  for (const s of guruStatusDist) {
    const norm = normalizeStatusKepegawaian(s.statusKepegawaian)
    if (!norm || norm === "-") continue
    statusCountMap.set(norm, (statusCountMap.get(norm) || 0) + s._count._all)
  }
  const guruStatusData = Array.from(statusCountMap.entries()).map(([name, value]) => ({
    name,
    value
  }))

  const guruPendidikanDist = await prisma.guru.groupBy({
    by: ['pendidikan'],
    where: { unitSekolahId: unitId, isDeleted: false, isActive: true },
    _count: { _all: true }
  })
  const guruPendidikanData = guruPendidikanDist.map(p => ({
    name: p.pendidikan || 'Tidak Diketahui',
    value: p._count._all
  }))

  // Kepadatan Siswa per Rombel (Data SubKelas & Kapasitas >35)
  const subKelasList = await prisma.subKelas.findMany({
    where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) },
    select: { 
      id: true,
      name: true, 
      _count: { select: { riwayatKelas: { where: { isCurrent: true, murid: { isActive: true } } } } },
      riwayatKelas: {
        where: { isCurrent: true, murid: { isActive: true } },
        select: {
          murid: {
            select: { name: true, gender: true }
          }
        },
        take: 50 // fetch more to get accurate gender count, we'll limit to top 5 for the list
      }
    }
  })
  
  const rombelData = subKelasList
    .map(sk => {
      const allStudents = sk.riwayatKelas.map(rk => rk.murid).filter(Boolean);
      const maleCount = allStudents.filter(s => s.gender === "Laki-laki").length;
      const femaleCount = allStudents.filter(s => s.gender === "Perempuan").length;
      
      return { 
        id: sk.id,
        name: sk.name, 
        total: sk._count.riwayatKelas,
        genderDist: [
          { name: "Laki-laki", value: maleCount, color: "#3b82f6" },
          { name: "Perempuan", value: femaleCount, color: "#ec4899" }
        ],
        topStudents: allStudents.slice(0, 5)
      }
    })
    .filter(sk => sk.total > 0)
    .sort((a, b) => sortSchoolClasses(a.name, b.name))
    
  const capacityWarnings = rombelData.filter(r => r.total > 35)

  // 4. Gender
  const genderDist = await prisma.murid.groupBy({
    by: ['gender'],
    where: { 
      isActive: true, 
      unitSekolahId: unitId,
      ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
    },
    _count: { _all: true }
  })
  
  const unitGenderMap = { 'Laki-laki': 0, 'Perempuan': 0, 'Tidak Diketahui': 0 }
  genderDist.forEach(g => {
    if (g.gender === 'Laki-laki' || g.gender === 'Perempuan') {
      unitGenderMap[g.gender] += g._count._all
    } else {
      unitGenderMap['Tidak Diketahui'] += g._count._all
    }
  })
  const genderData = [
    { name: 'Laki-laki', value: unitGenderMap['Laki-laki'], color: '#3b82f6' },
    { name: 'Perempuan', value: unitGenderMap['Perempuan'], color: '#ec4899' },
    { name: 'Tidak Diketahui', value: unitGenderMap['Tidak Diketahui'], color: '#94a3b8' }
  ].filter(g => g.value > 0)

  // 5. Anomali & Data Tidak Lengkap
  const incompleteDataCount = await prisma.murid.count({
    where: {
      unitSekolahId: unitId, isActive: true,
      OR: [ 
        { nisn: null }, { nisn: '' }, { nisn: '-' }, { nisn: ' - ' },
        { nik: null }, { nik: '' }, { nik: '-' }, { nik: ' - ' },
        { nis: null }, { nis: '' }, { nis: '-' }, { nis: ' - ' }
      ]
    }
  })

  // 11. KEUANGAN UNIT (Bulan Ini)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

  const [kasMasukUnit, kasKeluarUnit, tagihanUnitLengkap] = await Promise.all([
    prisma.transaksi.aggregate({
      where: { unitSekolahId: unitId, jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalNilai: true }
    }),
    prisma.transaksi.aggregate({
      where: { unitSekolahId: unitId, jenis: 'KAS_KELUAR', status: 'POSTED', tanggal: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalNilai: true }
    }),
    prisma.tagihan.aggregate({
      where: { murid: { unitSekolahId: unitId } },
      _sum: { jumlah: true, sisaTagihan: true }
    })
  ])
  const penerimaanBulanIni = kasMasukUnit._sum.totalNilai || 0
  const pengeluaranBulanIni = kasKeluarUnit._sum.totalNilai || 0

  const totalTagihanUnit = tagihanUnitLengkap._sum.jumlah || 0
  const totalTunggakanUnit = tagihanUnitLengkap._sum.sisaTagihan || 0
  const terbayarUnit = totalTagihanUnit - totalTunggakanUnit
  const kolektibilitasUnit = totalTagihanUnit > 0 ? Math.round((terbayarUnit / totalTagihanUnit) * 100) : null

  const tunggakanKritisList = await prisma.tagihan.findMany({
    where: { murid: { unitSekolahId: unitId }, sisaTagihan: { gt: 0 } },
    orderBy: { sisaTagihan: 'desc' },
    take: 5,
    select: { id: true, jumlah: true, sisaTagihan: true, keterangan: true, murid: { select: { id: true, name: true, nis: true, nisn: true } }, akun: { select: { nama: true } } }
  })

  // Perbandingan Pendapatan (Hari, Minggu, Bulan Ini)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1)) // Monday

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
  const rawMonthTransactionsU = await prisma.transaksi.findMany({
    where: { unitSekolahId: unitId, jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: monthStart } },
    select: { tanggal: true, totalNilai: true }
  })
  const interactiveChartDataU = generateInteractiveChartData(rawMonthTransactionsU, todayStart, weekStart, monthStart)

  const currentYearU = new Date().getFullYear()
  const years = [currentYearU - 2, currentYearU - 1, currentYearU]
  const trendCounts = await Promise.all(
    years.map(year =>
      prisma.murid.count({
        where: {
          unitSekolahId: unitId,
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`)
          }
        }
      })
    )
  )
  const trendData = years.map((year, idx) => ({
    year: year.toString(),
    total: trendCounts[idx]
  }))

  return {
    totalMurid, totalRombel, totalSubKelas: totalRombel, totalGuru,
    rombelData, capacityWarnings,
    genderData,
    guruStatusData, guruPendidikanData,
    trendData,
    // Ekstra Keuangan Unit
    penerimaanBulanIni, pengeluaranBulanIni, totalTunggakanUnit, tunggakanKritisList, kolektibilitasUnit,
    incompleteDataCount,
    ...interactiveChartDataU
  }
}

// Alias untuk menjaga kompabilitas
export const getAdminUnitData = getUnitDashboardData;
export const getTuUnitData = getUnitDashboardData;

// ==================== SUPERADMIN OPERASIONAL ====================
import { getAuditCockpitSummary } from "@/actions/audit-log"
import { getErrorCockpitSummary } from "@/actions/error-log"

export async function getAdminOperasionalData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [cockpitSummary, rawLogs] = await Promise.all([
    getAuditCockpitSummary(),
    prisma.logAktivitas.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, modul: true, pengguna: { select: { role: true, name: true, id: true } } },
      orderBy: { createdAt: 'asc' }
    })
  ])

  // Area Chart: Tren 30 hari
  const activityMap = new Map<string, number>()
  // Modul Donut
  const modulMap = new Map<string, number>()
  // Role Pie
  const roleMap = new Map<string, number>()
  // Heatmap (Day vs Hour)
  const heatmapMap = new Map<string, number>() // key: "Day-Hour" e.g., "0-9" (Sun 9AM)
  
  // Leaderboard
  const userMap = new Map<string, { id: string, name: string, role: string, count: number }>()

  rawLogs.forEach(log => {
    // Trend
    const dateStr = log.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1)
    
    // Modul
    modulMap.set(log.modul, (modulMap.get(log.modul) || 0) + 1)
    
    // Role
    roleMap.set(log.pengguna.role, (roleMap.get(log.pengguna.role) || 0) + 1)

    // Heatmap
    const day = log.createdAt.getDay()
    const hour = log.createdAt.getHours()
    const heatKey = `${day}-${hour}`
    heatmapMap.set(heatKey, (heatmapMap.get(heatKey) || 0) + 1)

    // Leaderboard
    const uKey = log.pengguna.id
    if (!userMap.has(uKey)) {
      userMap.set(uKey, { id: uKey, name: log.pengguna.name, role: log.pengguna.role, count: 0 })
    }
    userMap.get(uKey)!.count++
  })

  const trendData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
    trendData.push({ date: dateStr, total: activityMap.get(dateStr) || 0 })
  }

  const modulData = Array.from(modulMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  const roleData = Array.from(roleMap.entries()).map(([name, value]) => ({ name, value }))
  
  // Format Heatmap for Recharts ScatterChart
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const heatmapData = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapData.push({
        day: d,
        dayName: days[d],
        hour: h,
        value: heatmapMap.get(`${d}-${h}`) || 0
      })
    }
  }

  const leaderboard = Array.from(userMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)

  const recentLogsRaw = await prisma.logAktivitas.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: { id: true, aksi: true, modul: true, keterangan: true, createdAt: true, pengguna: { select: { name: true } } }
  })

  const recentLogs = recentLogsRaw.map(l => ({
    id: l.id, aksi: l.aksi, modul: l.modul, keterangan: l.keterangan, createdAt: l.createdAt.toISOString(), penggunaName: l.pengguna.name
  }))

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const dauCountRaw = await prisma.logAktivitas.groupBy({
    by: ['penggunaId'],
    where: { createdAt: { gte: todayStart } }
  })
  const dauCount = dauCountRaw.length

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const monthlyLogsCount = await prisma.logAktivitas.count({
    where: { createdAt: { gte: monthStart } }
  })

  // NEW: Kalkulasi Riil Volume Data Induk (Master Data Volume)
  const [totalPengguna, totalUnit, totalMurid, totalRombel, pengaturan] = await Promise.all([
    prisma.pengguna.count(),
    prisma.unitSekolah.count(),
    prisma.murid.count(),
    prisma.subKelas.count(),
    prisma.pengaturan.findFirst()
  ])
  const totalMasterRecords = totalPengguna + totalUnit + totalMurid + totalRombel

  // NEW: Laju Aktivitas Harian Rata-rata (30 Hari Terakhir)
  const total30DaysLogs = Array.from(activityMap.values()).reduce((sum, val) => sum + val, 0)
  const avgDailyLogs = Math.round(total30DaysLogs / 30)

  // NEW: Error Cockpit Telemetri Summary
  let errorCockpitSummary = null
  try {
    errorCockpitSummary = await getErrorCockpitSummary()
  } catch {
    // Graceful fallback jika belum terotentikasi saat build
  }

  return { 
    cockpitSummary,
    errorCockpitSummary,
    trendData, modulData, roleData, heatmapData, leaderboard, recentLogs, 
    dauCount, monthlyLogsCount, totalMasterRecords, avgDailyLogs, pengaturan 
  }
}

// Tata Usaha queries kini menggunakan alias getYayasanDashboardData dan getUnitDashboardData di atas


// ==================== KEPALA SEKOLAH ====================
export async function getKepsekData(unitId: string, yearId?: string) {
  const [totalMurid, totalRombel, totalGuru] = await Promise.all([
    prisma.murid.count({ 
      where: { 
        isActive: true, 
        unitSekolahId: unitId,
        ...(yearId ? { riwayatKelas: { some: { isCurrent: true, tahunAkademikId: yearId } } } : {})
      } 
    }),
    prisma.subKelas.count({ where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) } }),
    prisma.guru.count({ where: { unitSekolahId: unitId, isDeleted: false, isActive: true } })
  ])

  // Pendidikan Guru
  const guruPendidikanDist = await prisma.guru.groupBy({
    by: ['pendidikan'],
    where: { unitSekolahId: unitId, isDeleted: false, isActive: true },
    _count: { _all: true }
  })
  const guruPendidikanData = guruPendidikanDist.map(p => ({
    name: p.pendidikan || 'Tidak Diketahui',
    value: p._count._all
  }))

  // Skor Kualitas Data
  const completeDataCount = await prisma.murid.count({
    where: {
      unitSekolahId: unitId, isActive: true,
      nik: { not: null, notIn: [''] }, nisn: { not: null, notIn: [''] },
      fatherName: { not: null, notIn: [''] }, motherName: { not: null, notIn: [''] }
    }
  })
  const dataQualityScore = totalMurid > 0 ? Math.round((completeDataCount / totalMurid) * 100) : 0

  // Profil Pekerjaan Ortu
  const jobDist = await prisma.murid.groupBy({
    by: ['fatherOccupation'],
    where: { isActive: true, unitSekolahId: unitId, fatherOccupation: { not: null, notIn: [''] } },
    _count: { _all: true }
  })
  const jobData = jobDist.map(j => ({ name: j.fatherOccupation, value: j._count._all }))

  // Peringkat Kepadatan Kelas (Top 3 Padat, Top 3 Longgar)
  const rombelDist = await prisma.subKelas.findMany({
    where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) },
    select: { name: true, _count: { select: { riwayatKelas: { where: { isCurrent: true, murid: { isActive: true } } } } } }
  })
  const sortedRombel = rombelDist.map(sk => ({ name: sk.name, total: sk._count.riwayatKelas })).sort((a,b) => b.total - a.total)
  
  const topCrowded = sortedRombel.slice(0, 3)
  const topEmpty = sortedRombel.slice().reverse().slice(0, 3)

  // Tren Mutasi / DO (Masuk vs Keluar tahun ini)
  const thisYearStart = new Date(new Date().getFullYear(), 0, 1)
  const admitted = await prisma.murid.count({
    where: { unitSekolahId: unitId, createdAt: { gte: thisYearStart } }
  })
  const dropped = await prisma.murid.count({
    where: { unitSekolahId: unitId, status: { not: 'AKTIF' }, updatedAt: { gte: thisYearStart } }
  })
  const retentionData = [
    { name: 'Siswa Masuk', value: admitted, color: '#3b82f6' },
    { name: 'Siswa Keluar/DO', value: dropped, color: '#f43f5e' }
  ]

  // Distribusi Jenjang/Rombel (Treemap)
  const tingkatDist = await prisma.tingkat.findMany({
    where: { unitSekolahId: unitId },
    select: {
      name: true,
      subKelas: {
        where: { isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) },
        select: { _count: { select: { riwayatKelas: { where: { isCurrent: true, murid: { isActive: true } } } } } }
      }
    }
  })
  
  const jenjangData = tingkatDist.map(t => {
    const total = t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0)
    return { name: t.name, value: total }
  }).filter(t => t.value > 0).sort((a, b) => sortSchoolClasses(a.name, b.name))

  // Rentang Pendapatan Ortu
  const incomeDist = await prisma.murid.groupBy({
    by: ['fatherIncome'],
    where: { isActive: true, unitSekolahId: unitId, fatherIncome: { not: null, notIn: [''] } },
    _count: { _all: true }
  })
  const incomeData = incomeDist.map((i, idx) => ({
    name: i.fatherIncome || 'Tidak Diketahui',
    value: i._count._all,
    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'][idx % 6]
  }))

  // ==================== KEUANGAN (FINANCIAL METRICS) ====================
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

  const [kasMasukUnit, kasKeluarUnit, tagihanUnitAgg] = await Promise.all([
    prisma.transaksi.aggregate({
      where: { unitSekolahId: unitId, jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalNilai: true }
    }),
    prisma.transaksi.aggregate({
      where: { unitSekolahId: unitId, jenis: 'KAS_KELUAR', status: 'POSTED', tanggal: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { totalNilai: true }
    }),
    prisma.tagihan.aggregate({
      where: { murid: { unitSekolahId: unitId } },
      _sum: { jumlah: true, sisaTagihan: true }
    })
  ])
  const penerimaanBulanIni = kasMasukUnit._sum.totalNilai || 0
  const pengeluaranBulanIni = kasKeluarUnit._sum.totalNilai || 0
  const saldoBulanIni = penerimaanBulanIni - pengeluaranBulanIni

  // Kolektibilitas
  const totalTagihanUnit = tagihanUnitAgg._sum.jumlah || 0
  const totalSisaTagihanUnit = tagihanUnitAgg._sum.sisaTagihan || 0
  const totalLunasUnit = totalTagihanUnit - totalSisaTagihanUnit
  const kolektibilitasData = [
    { name: 'Lunas', value: totalLunasUnit, color: '#10b981' }, // emerald
    { name: 'Belum Lunas', value: totalSisaTagihanUnit, color: '#f43f5e' } // rose
  ]

  // Alokasi Pengeluaran
  const pengeluaranDetailRaw = await prisma.transaksiDetail.findMany({
    where: {
      transaksi: { unitSekolahId: unitId, jenis: 'KAS_KELUAR', status: 'POSTED', tanggal: { gte: startOfMonth, lte: endOfMonth } }
    },
    select: { nilai: true, akun: { select: { nama: true } } }
  })
  const alokasiMap = new Map<string, number>()
  pengeluaranDetailRaw.forEach(d => {
    const akunName = d.akun?.nama || 'Lainnya'
    alokasiMap.set(akunName, (alokasiMap.get(akunName) || 0) + d.nilai)
  })
  const alokasiPengeluaran = Array.from(alokasiMap.entries())
    .map(([name, value], idx) => ({ name, value, color: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'][idx % 6] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Perbandingan Pendapatan
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1)) // Monday

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
  const rawMonthTransactionsK = await prisma.transaksi.findMany({
    where: { unitSekolahId: unitId, jenis: 'KAS_MASUK', status: 'POSTED', tanggal: { gte: monthStart } },
    select: { tanggal: true, totalNilai: true }
  })
  const interactiveChartDataK = generateInteractiveChartData(rawMonthTransactionsK, todayStart, weekStart, monthStart)

  const kolektibilitasPersen = totalTagihanUnit > 0 ? Math.round((totalLunasUnit / totalTagihanUnit) * 100) : null

  return { 
    totalMurid, totalRombel, totalGuru, guruPendidikanData, 
    dataQualityScore, jobData, incomeData, topCrowded, topEmpty, retentionData, 
    jenjangData,
    // Keuangan
    penerimaanBulanIni, pengeluaranBulanIni, saldoBulanIni, kolektibilitasData, alokasiPengeluaran,
    totalTagihanUnit, totalSisaTagihanUnit, kolektibilitasPersen,
    ...interactiveChartDataK
  }
}
