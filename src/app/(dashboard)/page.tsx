import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { 
  getYayasanDashboardData, getUnitDashboardData, getAdminOperasionalData, 
  getKepsekData 
} from "@/lib/dashboard-queries"

import DashboardNavTabs from "@/components/dashboard/DashboardNavTabs"
import YayasanDashboard from "@/components/dashboard/YayasanDashboard"
import UnitDashboard from "@/components/dashboard/UnitDashboard"
import OperasionalDashboard from "@/components/dashboard/OperasionalDashboard"
import KepsekDashboard from "@/components/dashboard/KepsekDashboard"

export default async function DashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const activeTab = searchParams?.tab || "yayasan"

  const session = await auth()
  const role = session?.user?.role || "TATA_USAHA"

  // Helper untuk mengambil active unit dan year dari cookie
  const getActiveContext = async () => {
    const userUnitId = (session?.user as any)?.unitSekolahId
    const [schoolUnits, allAcademicYears] = await Promise.all([
      prisma.unitSekolah.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.tahunAkademik.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { createdAt: 'desc' } })
    ])
    const cookieStore = await cookies()
    
    let activeUnitId = cookieStore.get("activeUnitId")?.value
    
    if ((role === "ADMIN" || role === "YAYASAN") && !activeUnitId) {
      activeUnitId = "all"
    } else if (role !== "ADMIN" && role !== "YAYASAN" && userUnitId) {
      activeUnitId = userUnitId
    } else if (!activeUnitId) {
      activeUnitId = schoolUnits[0]?.id
    }
    
    const activeYearId = cookieStore.get("activeYearId")?.value || allAcademicYears.find(y => y.isActive)?.id || allAcademicYears[0]?.id

    return {
      schoolUnits, allAcademicYears,
      activeUnit: schoolUnits.find(u => u.id === activeUnitId),
      activeYear: allAcademicYears.find(y => y.id === activeYearId),
      activeUnitId, activeYearId
    }
  }

  // ==================== SUPERADMIN (ADMIN) ====================
  if (role === "ADMIN") {
    const { schoolUnits, activeYearId, activeUnitId } = await getActiveContext()

    if (activeTab === "yayasan") {
      const data = await getYayasanDashboardData(activeYearId)
      return (
        <div className="max-w-[1600px] mx-auto w-full">
          <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
          <YayasanDashboard role="ADMIN" {...data} />
        </div>
      )
    }

    if (activeTab === "unit") {
      // Jika tab=unit terakses saat mode Semua Unit, arahkan kembali (fallback) ke Yayasan
      if (activeUnitId === "all") {
        const data = await getYayasanDashboardData(activeYearId)
        return (
          <div className="max-w-[1600px] mx-auto w-full">
            <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
            <YayasanDashboard role="ADMIN" {...data} />
          </div>
        )
      }

      const selectedUnit = schoolUnits.find(u => u.id === activeUnitId)

      if (!activeUnitId) {
        return (
          <div className="max-w-[1600px] mx-auto w-full">
            <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
            <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
          </div>
        )
      }

      const data = await getUnitDashboardData(activeUnitId, activeYearId)
      return (
        <div className="max-w-[1600px] mx-auto w-full">
          <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
          <UnitDashboard role="ADMIN" unitName={selectedUnit?.name || 'Unit'} {...data} />
        </div>
      )
    }

    if (activeTab === "operasional") {
      const data = await getAdminOperasionalData()
      return (
        <div className="max-w-[1600px] mx-auto w-full">
          <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
          <OperasionalDashboard userName={session?.user?.name || undefined} {...data} />
        </div>
      )
    }

    // Default fallback
    const data = await getYayasanDashboardData(activeYearId)
    return (
      <div className="max-w-[1600px] mx-auto w-full">
        <DashboardNavTabs role="ADMIN" units={schoolUnits} activeUnitId={activeUnitId} />
        <YayasanDashboard role="ADMIN" {...data} />
      </div>
    )
  }

  // ==================== TATA USAHA ====================
  if (role === "TATA_USAHA") {
    const { activeUnit, activeYear, activeUnitId, activeYearId } = await getActiveContext()
    
    if (!activeUnitId) {
      return (
        <div className="max-w-[1600px] mx-auto w-full">
          <DashboardNavTabs role="TATA_USAHA" />
          <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
        </div>
      )
    }

    const data = await getUnitDashboardData(activeUnitId, activeYearId)
    return (
      <div className="max-w-[1600px] mx-auto w-full">
        <DashboardNavTabs role="TATA_USAHA" />
        <UnitDashboard role="TATA_USAHA" unitName={activeUnit?.name || 'Unit Sekolah'} {...data} />
      </div>
    )
  }

  // ==================== PENGURUS YAYASAN ====================
  if (role === "YAYASAN") {
    const { schoolUnits, activeYearId, activeUnitId } = await getActiveContext()

    if (activeUnitId && activeUnitId !== "all") {
      if (activeTab === "unit" || !searchParams?.tab) {
        const selectedUnit = schoolUnits.find(u => u.id === activeUnitId)
        const data = await getUnitDashboardData(activeUnitId, activeYearId)
        return (
          <div className="max-w-[1600px] mx-auto w-full">
            <DashboardNavTabs role="YAYASAN" units={schoolUnits} activeUnitId={activeUnitId} />
            <UnitDashboard role="YAYASAN" unitName={selectedUnit?.name || 'Unit'} {...data} />
          </div>
        )
      }
    }

    const data = await getYayasanDashboardData(activeYearId)
    return (
      <div className="max-w-[1600px] mx-auto w-full">
        <DashboardNavTabs role="YAYASAN" units={schoolUnits} activeUnitId={activeUnitId} />
        <YayasanDashboard role="YAYASAN" {...data} />
      </div>
    )
  }

  // ==================== KEPALA SEKOLAH ====================
  const { activeUnit, activeYear, activeUnitId, activeYearId } = await getActiveContext()
  
  if (!activeUnitId) {
    return (
      <div className="max-w-[1600px] mx-auto w-full">
        <DashboardNavTabs role="KEPALA_SEKOLAH" />
        <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
      </div>
    )
  }

  const data = await getKepsekData(activeUnitId, activeYearId)
  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <DashboardNavTabs role="KEPALA_SEKOLAH" />
      <KepsekDashboard activeUnit={activeUnit} activeYear={activeYear} {...data} />
    </div>
  )
}
