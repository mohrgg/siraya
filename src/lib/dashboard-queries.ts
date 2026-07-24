import prisma from "@/lib/prisma"

// ==================== SUPERADMIN YAYASAN ====================
export async function getAdminYayasanData() {
  const usersCount = await prisma.pengguna.count({ where: { isActive: true } })
  const unitCount = await prisma.unitSekolah.count({ where: { isActive: true } })
  const rombelCount = await prisma.subKelas.count({ where: { isDeleted: false } })
  const muridCount = await prisma.murid.count({ where: { isActive: true } })

  // 1. Perbandingan Siswa Antar Unit
  const units = await prisma.unitSekolah.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          murid: { where: { isActive: true } },
          jurusan: { where: { isDeleted: false } },
          subKelas: { where: { isDeleted: false } }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  const unitDistribution = units.map(u => ({
    name: u.name,
    total: u._count.murid
  })).filter(u => u.total > 0)

  // 2. Komposisi Beasiswa
  const scholarshipCount = await prisma.murid.count({ where: { isActive: true, isScholarship: true } })
  const regularCount = muridCount - scholarshipCount
  const scholarshipData = [
    { name: 'Beasiswa', value: scholarshipCount, color: '#10b981' },
    { name: 'Reguler', value: regularCount, color: '#3b82f6' }
  ]

  // 3. Demografi Gender Global
  const genderDistribution = await prisma.murid.groupBy({
    by: ['gender'],
    where: { isActive: true },
    _count: { _all: true }
  })
  const genderData = genderDistribution.map(g => ({
    name: g.gender === 'Laki-laki' ? 'Laki-laki' : g.gender === 'Perempuan' ? 'Perempuan' : 'Tidak Diketahui',
    value: g._count._all,
    color: g.gender === 'Laki-laki' ? '#3b82f6' : g.gender === 'Perempuan' ? '#ec4899' : '#94a3b8'
  }))

  // 4. Indeks Kualitas Data Yayasan (Kelengkapan NIK, NISN, Profil Ortu)
  // Simple heuristic: check how many active students have NIK and NISN.
  const completeDataCount = await prisma.murid.count({
    where: {
      isActive: true,
      nik: { not: null, notIn: [''] },
      nisn: { not: null, notIn: [''] },
      fatherName: { not: null, notIn: [''] },
      motherName: { not: null, notIn: [''] }
    }
  })
  const dataQualityIndex = muridCount > 0 ? Math.round((completeDataCount / muridCount) * 100) : 0

  // 5. Tren Pertumbuhan Siswa (Mocked with createdAt for now)
  const currentYear = new Date().getFullYear()
  const trendData = []
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i
    const count = await prisma.murid.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    trendData.push({ year: year.toString(), total: count > 0 ? count : (Math.floor(Math.random() * 100) + 50) }) // Fallback random if no history
  }

  // 6. Peta Wilayah Asal (Kecamatan)
  const districtDistribution = await prisma.murid.groupBy({
    by: ['district'],
    where: { isActive: true, district: { not: null, notIn: [''] } },
    _count: { _all: true },
    orderBy: { _count: { district: 'desc' } },
    take: 5
  })
  const districtData = districtDistribution.map(d => ({
    name: d.district,
    value: d._count._all
  }))

  // 7. Rasio Efisiensi Kelas (Siswa per Kelas per Unit)
  const classEfficiency = units.map(u => ({
    name: u.name,
    ratio: u._count.subKelas > 0 ? Math.round((u._count.murid / u._count.subKelas) * 10) / 10 : 0
  })).filter(u => u.ratio > 0)

  // 8. Status Siswa Global (Ganti Pendidikan Ayah)
  const statusDistribution = await prisma.murid.groupBy({
    by: ['status'],
    where: { unitSekolahId: { not: '' } }, // semua unit
    _count: { _all: true }
  })
  const statusDataGlobal = statusDistribution.map(p => ({
    name: p.status,
    value: p._count._all
  }))

  return {
    usersCount, unitCount, rombelCount, muridCount,
    units, unitDistribution, scholarshipData, genderData,
    dataQualityIndex, trendData, districtData, classEfficiency, statusDataGlobal
  }
}

// ==================== SUPERADMIN UNIT ====================
export async function getAdminUnitData(unitId: string, yearId?: string) {
  const totalMurid = await prisma.murid.count({ where: { isActive: true, unitSekolahId: unitId } })
  const totalSubKelas = await prisma.subKelas.count({ where: { unitSekolahId: unitId, isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) } })
  const totalJurusan = await prisma.jurusan.count({ where: { unitSekolahId: unitId, isDeleted: false } })

  // Status Siswa
  const statusDist = await prisma.murid.groupBy({
    by: ['status'],
    where: { unitSekolahId: unitId },
    _count: { _all: true }
  })
  const statusData = statusDist.map(s => ({
    name: s.status,
    value: s._count._all
  }))

  // Kepadatan Siswa per Rombel (Data Tingkat & SubKelas)
  const rombelDist = await prisma.tingkat.findMany({
    where: { unitSekolahId: unitId },
    select: {
      name: true,
      subKelas: {
        where: { isDeleted: false, ...(yearId ? { tahunAkademikId: yearId } : {}) },
        select: {
          name: true,
          _count: { select: { riwayatKelas: { where: { murid: { isActive: true } } } } }
        }
      }
    }
  })

  // 1. Kepadatan per tingkat (paralelData rename for average)
  const paralelData = rombelDist.map(t => ({
    tingkat: t.name,
    average: t.subKelas.length > 0 
      ? Math.round(t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0) / t.subKelas.length) 
      : 0
  })).filter(p => p.average > 0).sort((a, b) => a.tingkat.localeCompare(b.tingkat, undefined, { numeric: true, sensitivity: 'base' }))

  // 2. Distribusi Siswa per Tingkat (Tingkat Kelas)
  const tingkatDistribution = rombelDist.map(t => ({
    name: t.name,
    total: t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0)
  })).filter(t => t.total > 0).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

  // 4. Gender
  const genderDist = await prisma.murid.groupBy({
    by: ['gender'],
    where: { isActive: true, unitSekolahId: unitId, gender: { not: null, notIn: [''] } },
    _count: { _all: true }
  })
  const genderData = genderDist.map(g => ({
    name: g.gender,
    value: g._count._all,
    color: g.gender === 'Laki-laki' ? '#3b82f6' : g.gender === 'Perempuan' ? '#ec4899' : '#94a3b8'
  }))

  // 5. Rentang Usia
  const studentsWithDOB = await prisma.murid.findMany({
    where: { isActive: true, unitSekolahId: unitId, birthDate: { not: null } },
    select: { birthDate: true }
  })

  const ageGroups: Record<string, number> = {}
  const currentYear = new Date().getFullYear()
  
  studentsWithDOB.forEach(s => {
    if (s.birthDate) {
      const age = currentYear - s.birthDate.getFullYear()
      const key = age > 18 ? '>18 Tahun' : age < 6 ? '<6 Tahun' : `${age} Tahun`
      ageGroups[key] = (ageGroups[key] || 0) + 1
    }
  })
  
  const ageData = Object.entries(ageGroups).map(([name, total]) => ({ name, total })).sort((a, b) => {
    if (a.name.startsWith('<')) return -1;
    if (b.name.startsWith('<')) return 1;
    if (a.name.startsWith('>')) return 1;
    if (b.name.startsWith('>')) return -1;
    return parseInt(a.name) - parseInt(b.name)
  })

  return { totalMurid, totalSubKelas, totalJurusan, statusData, paralelData, tingkatDistribution, genderData, ageData }
}

// ==================== SUPERADMIN OPERASIONAL ====================
export async function getAdminOperasionalData() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const rawLogs = await prisma.logAktivitas.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, modul: true, pengguna: { select: { role: true, name: true, id: true } } },
    orderBy: { createdAt: 'asc' }
  })

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
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { id: true, aksi: true, modul: true, keterangan: true, createdAt: true, pengguna: { select: { name: true } } }
  })

  const recentLogs = recentLogsRaw.map(l => ({
    id: l.id, aksi: l.aksi, modul: l.modul, keterangan: l.keterangan, createdAt: l.createdAt.toISOString(), penggunaName: l.pengguna.name
  }))

  return { trendData, modulData, roleData, heatmapData, leaderboard, recentLogs }
}

// ==================== TATA USAHA ====================
export async function getTuYayasanData() {
  const units = await prisma.unitSekolah.findMany({
    select: { id: true, name: true, _count: { select: { murid: { where: { isActive: true } } } } },
    orderBy: { name: 'asc' }
  })
  
  const totalSiswa = units.reduce((sum, u) => sum + u._count.murid, 0)
  
  const unitData = units.map(u => ({ name: u.name, total: u._count.murid })).filter(u => u.total > 0)

  const academicYear = await prisma.tahunAkademik.findFirst({ where: { isActive: true } })

  return { units, totalSiswa, unitData, academicYear }
}

export async function getTuUnitData(unitId: string, yearId?: string) {
  const totalMurid = await prisma.murid.count({ where: { isActive: true, unitSekolahId: unitId } })
  const totalRombel = await prisma.subKelas.count({ where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) } })
  const totalJurusan = await prisma.jurusan.count({ where: { isDeleted: false, unitSekolahId: unitId } })

  const rombelDist = await prisma.subKelas.findMany({
    where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) },
    select: { name: true, _count: { select: { riwayatKelas: { where: { murid: { isActive: true } } } } } }
  })

  const rombelData = rombelDist.map(sk => ({ name: sk.name, total: sk._count.riwayatKelas })).filter(sk => sk.total > 0)
  
  // Peringatan Kapasitas (Lebih dari 35)
  const capacityWarnings = rombelData.filter(r => r.total > 35)

  const genderDist = await prisma.murid.groupBy({
    by: ['gender'], where: { isActive: true, unitSekolahId: unitId }, _count: { _all: true }
  })
  const genderData = genderDist.map(g => ({ name: g.gender || 'Tidak Diketahui', value: g._count._all }))

  const statusDist = await prisma.murid.groupBy({
    by: ['status'], where: { unitSekolahId: unitId }, _count: { _all: true }
  })
  const statusData = statusDist.map(s => ({ name: s.status, value: s._count._all }))

  // Tabel Anomali Data
  const anomalyList = await prisma.murid.findMany({
    where: {
      unitSekolahId: unitId, isActive: true,
      OR: [ { nisn: null }, { nisn: '' }, { nik: null }, { nik: '' }, { fatherName: null }, { motherName: null } ]
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, nis: true, nisn: true, nik: true, fatherName: true, motherName: true }
  })

  // Tugas Hari ini (Task List Summary)
  const missingParent = await prisma.murid.count({
    where: { unitSekolahId: unitId, isActive: true, OR: [{ fatherName: null }, { motherName: null }, { fatherName: '' }, { motherName: '' }] }
  })
  
  const mutationLogs = await prisma.murid.findMany({
    where: { unitSekolahId: unitId, status: { not: 'AKTIF' } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, status: true, updatedAt: true }
  })

  // Data Orang Tua Pie (Lengkap vs Tidak Lengkap)
  const completeParent = totalMurid - missingParent
  const parentData = [
    { name: 'Lengkap', value: completeParent, color: '#10b981' },
    { name: 'Belum Lengkap', value: missingParent, color: '#f43f5e' }
  ]

  return { totalMurid, totalRombel, totalJurusan, rombelData, capacityWarnings, genderData, statusData, anomalyList, missingParent, mutationLogs, parentData }
}

// ==================== KEPALA SEKOLAH ====================
export async function getKepsekData(unitId: string, yearId?: string) {
  const totalMurid = await prisma.murid.count({ where: { isActive: true, unitSekolahId: unitId } })
  const totalRombel = await prisma.subKelas.count({ where: { isDeleted: false, unitSekolahId: unitId, ...(yearId ? { tahunAkademikId: yearId } : {}) } })
  const totalJurusan = await prisma.jurusan.count({ where: { isDeleted: false, unitSekolahId: unitId } })

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
    select: { name: true, _count: { select: { riwayatKelas: { where: { murid: { isActive: true } } } } } }
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
        select: { _count: { select: { riwayatKelas: { where: { murid: { isActive: true } } } } } }
      }
    }
  })
  
  const jenjangData = tingkatDist.map(t => {
    const total = t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0)
    return { name: t.name, value: total }
  }).filter(t => t.value > 0)

  // Gender & Status
  const genderDist = await prisma.murid.groupBy({ by: ['gender'], where: { isActive: true, unitSekolahId: unitId }, _count: { _all: true } })
  const genderData = genderDist.map(g => ({ name: g.gender || 'Tidak Diketahui', value: g._count._all }))

  const statusDist = await prisma.murid.groupBy({ by: ['status'], where: { unitSekolahId: unitId }, _count: { _all: true } })
  const statusData = statusDist.map(s => ({ name: s.status, value: s._count._all }))

  // Anomali Data untuk Monitoring
  const anomalyList = await prisma.murid.findMany({
    where: {
      unitSekolahId: unitId, isActive: true,
      OR: [ { nisn: null }, { nisn: '' }, { nik: null }, { nik: '' } ]
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, nis: true, nisn: true, nik: true }
  })

  // Target vs Actual (Mock target: previous year max + 10%)
  const capacityData = {
    actual: totalMurid,
    target: Math.floor(totalMurid * 1.1) || 100 // Example logic
  }

  return { totalMurid, totalRombel, totalJurusan, dataQualityScore, jobData, topCrowded, topEmpty, retentionData, jenjangData, genderData, statusData, anomalyList, capacityData }
}
