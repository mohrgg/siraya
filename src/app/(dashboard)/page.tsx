import { Wallet, ArrowUpRight, ArrowDownRight, Activity, Users, FileText, GraduationCap, Building } from "lucide-react"
import prisma from "@/lib/prisma"
import CashFlowChart from "@/components/dashboard/CashFlowChart"
import StudentDemographicChart from "@/components/dashboard/StudentDemographicChart"

import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import AdminDashboard from "@/components/dashboard/AdminDashboard"
import TuDashboard from "@/components/dashboard/TuDashboard"
import KepsekDashboard from "@/components/dashboard/KepsekDashboard"

export default async function DashboardPage() {
  const session = await auth()
  const role = session?.user?.role || "TATA_USAHA"

  // For Admin Dashboard Stats
  if (role === "ADMIN") {
    const usersCount = await prisma.pengguna.count()
    const unitCount = await prisma.unitSekolah.count()
    const divisiCount = await prisma.divisi.count()
    const muridCount = await prisma.murid.count({ where: { isActive: true } })
    const kelasCount = await prisma.subKelas.count()
    
    // Keuangan Global
    const kasIn = await prisma.transaksiKas.aggregate({
      where: { type: 'IN', isDeleted: false },
      _sum: { totalAmount: true }
    })
    const kasOut = await prisma.transaksiKas.aggregate({
      where: { type: 'OUT', isDeleted: false },
      _sum: { totalAmount: true }
    })
    
    // Distribusi Murid per Unit beserta Rombel (Sub Kelas)
    const units = await prisma.unitSekolah.findMany({ 
      select: { 
        id: true, 
        name: true, 
        _count: { select: { murid: { where: { isActive: true } } } },
        subKelas: {
          select: {
            id: true,
            name: true,
            _count: { select: { riwayatKelas: { where: { murid: { isActive: true } } } } }
          }
        }
      } 
    })
    
    const unitDistribution = units.map(u => ({
      name: u.name,
      total: u._count.murid,
      rombel: u.subKelas.map(sk => ({
        name: sk.name,
        total: sk._count.riwayatKelas
      }))
    }))

    // Aktivitas Harian (7 Hari Terakhir)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const rawLogs = await prisma.logAktivitas.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { aksi: true, createdAt: true }
    })

    // Kelompokkan log berdasarkan tanggal
    const activityMap: Record<string, { total: number, login: number, mutation: number }> = {}
    
    // Inisialisasi 7 hari terakhir ke 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      activityMap[dateStr] = { total: 0, login: 0, mutation: 0 }
    }

    rawLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      if (activityMap[dateStr]) {
        activityMap[dateStr].total++
        if (log.aksi.includes('LOGIN')) activityMap[dateStr].login++
        else activityMap[dateStr].mutation++
      }
    })

    const activityData = Object.keys(activityMap).map(date => ({
      date,
      ...activityMap[date]
    }))

    // For System Tab
    const userRoles = await prisma.pengguna.groupBy({
      by: ['role'],
      _count: true
    })
    const userRolesCount = {
      ADMIN: userRoles.find(r => r.role === 'ADMIN')?._count || 0,
      TATA_USAHA: userRoles.find(r => r.role === 'TATA_USAHA')?._count || 0,
      KEPALA_SEKOLAH: userRoles.find(r => r.role === 'KEPALA_SEKOLAH')?._count || 0,
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const activeUsersToday = await prisma.logAktivitas.groupBy({
      by: ['penggunaId'],
      where: { 
        aksi: 'LOGIN',
        createdAt: { gte: todayStart }
      }
    }).then(res => res.length)

    // Ambil log aktivitas riil
    const logs = await prisma.logAktivitas.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { pengguna: { select: { email: true, name: true, role: true } } }
    })

    return (
      <div className="max-w-7xl mx-auto w-full">
        <AdminDashboard 
          usersCount={usersCount} 
          unitCount={unitCount} 
          divisiCount={divisiCount} 
          muridCount={muridCount}
          kelasCount={kelasCount}
          kasIn={Number(kasIn._sum.totalAmount || 0)}
          kasOut={Number(kasOut._sum.totalAmount || 0)}
          unitDistribution={unitDistribution}
          activityData={activityData}
          logs={logs}
          userRolesCount={userRolesCount}
          activeUsersToday={activeUsersToday}
        />
      </div>
    )
  }

  // For TU and Kepsek Dashboard Stats
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const allAcademicYears = await prisma.tahunAkademik.findMany({ orderBy: { createdAt: 'desc' } })
  const cookieStore = await cookies()
  const activeUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
  const activeYearId = cookieStore.get("activeYearId")?.value || allAcademicYears.find(y => y.isActive)?.id || allAcademicYears[0]?.id

  const activeUnit = schoolUnits.find(u => u.id === activeUnitId)
  const activeYear = allAcademicYears.find(y => y.id === activeYearId)

  // Fetch Live Master Data
  const totalMurid = await prisma.murid.count({
    where: { 
      isActive: true,
      ...(activeUnitId ? { unitSekolahId: activeUnitId } : {})
    }
  })
  
  const totalSubKelas = await prisma.subKelas.count({
    where: {
      ...(activeUnitId ? { unitSekolahId: activeUnitId } : {}),
      ...(activeYearId ? { tahunAkademikId: activeYearId } : {})
    }
  })
  
  const totalTingkat = await prisma.tingkat.count({
    where: activeUnitId ? { unitSekolahId: activeUnitId } : {}
  })

  // Data Sebaran Murid (Gender) - per unit
  const genderDistribution = await prisma.murid.groupBy({
    by: ['gender'],
    where: { 
      isActive: true,
      ...(activeUnitId ? { unitSekolahId: activeUnitId } : {})
    },
    _count: { _all: true }
  })

  const chartData = genderDistribution.map(g => ({
    name: g.gender === 'Laki-laki' ? 'Laki-laki' : g.gender === 'Perempuan' ? 'Perempuan' : 'Tidak Diketahui',
    value: g._count._all
  }))

  return (
    <div className="max-w-7xl mx-auto w-full">
      {role === "KEPALA_SEKOLAH" ? (
        <KepsekDashboard activeUnit={activeUnit} activeYear={activeYear} totalMurid={totalMurid} totalSubKelas={totalSubKelas} totalTingkat={totalTingkat} chartData={chartData} />
      ) : (
        <TuDashboard activeUnit={activeUnit} activeYear={activeYear} totalMurid={totalMurid} totalSubKelas={totalSubKelas} totalTingkat={totalTingkat} chartData={chartData} />
      )}
    </div>
  )
}
