import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { 
  getYayasanDashboardData, getUnitDashboardData, getAdminOperasionalData, 
  getKepsekData 
} from "@/lib/dashboard-queries"

import AdminTabs from "@/components/dashboard/AdminTabs"
import YayasanDashboard from "@/components/dashboard/YayasanDashboard"
import UnitDashboard from "@/components/dashboard/UnitDashboard"
import OperasionalDashboard from "@/components/dashboard/OperasionalDashboard"

import TuTabs from "@/components/dashboard/TuTabs"
import KepsekDashboard from "@/components/dashboard/KepsekDashboard"

export default async function DashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const activeTab = searchParams?.tab || "yayasan"

  const session = await auth()
  const role = session?.user?.role || "TATA_USAHA"

  // Helper untuk mengambil active unit dan year dari cookie
  const getActiveContext = async () => {
    const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
    const allAcademicYears = await prisma.tahunAkademik.findMany({ orderBy: { createdAt: 'desc' } })
    const cookieStore = await cookies()
    const activeUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
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
    const { schoolUnits, activeYearId } = await getActiveContext()

    if (activeTab === "yayasan") {
      const data = await getYayasanDashboardData()
      return (
        <div className="max-w-7xl mx-auto w-full">
          <AdminTabs units={schoolUnits} />
          <YayasanDashboard role="ADMIN" {...data} />
        </div>
      )
    }

    if (activeTab === "unit") {
      const selectedUnitId = searchParams?.unitId || schoolUnits[0]?.id
      const selectedUnit = schoolUnits.find(u => u.id === selectedUnitId)

      if (!selectedUnitId) {
        return (
          <div className="max-w-7xl mx-auto w-full">
            <AdminTabs units={schoolUnits} />
            <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
          </div>
        )
      }

      const data = await getUnitDashboardData(selectedUnitId, activeYearId)
      return (
        <div className="max-w-7xl mx-auto w-full">
          <AdminTabs units={schoolUnits} />
          <UnitDashboard role="ADMIN" unitName={selectedUnit?.name || 'Unit'} {...data} />
        </div>
      )
    }

    if (activeTab === "operasional") {
      const data = await getAdminOperasionalData()
      return (
        <div className="max-w-7xl mx-auto w-full">
          <AdminTabs units={schoolUnits} />
          <OperasionalDashboard {...data} />
        </div>
      )
    }

    // Default fallback
    const data = await getYayasanDashboardData()
    return (
      <div className="max-w-7xl mx-auto w-full">
        <AdminTabs units={schoolUnits} />
        <YayasanDashboard role="ADMIN" {...data} />
      </div>
    )
  }

  // ==================== TATA USAHA ====================
  if (role === "TATA_USAHA") {
    if (activeTab === "yayasan") {
      const data = await getYayasanDashboardData()
      return (
        <div className="max-w-7xl mx-auto w-full">
          <TuTabs />
          <YayasanDashboard role="TATA_USAHA" {...data} />
        </div>
      )
    }

    const { activeUnit, activeYear, activeUnitId, activeYearId } = await getActiveContext()
    
    if (!activeUnitId) {
      return (
        <div className="max-w-7xl mx-auto w-full">
          <TuTabs />
          <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
        </div>
      )
    }

    const data = await getUnitDashboardData(activeUnitId, activeYearId)
    return (
      <div className="max-w-7xl mx-auto w-full">
        <TuTabs />
        <UnitDashboard role="TATA_USAHA" unitName={activeUnit?.name || 'Unit Sekolah'} {...data} />
      </div>
    )
  }

  // ==================== KEPALA SEKOLAH ====================
  const { activeUnit, activeYear, activeUnitId, activeYearId } = await getActiveContext()
  
  if (!activeUnitId) {
    return (
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center h-64 text-text-muted font-medium">Belum ada unit sekolah terdaftar.</div>
      </div>
    )
  }

  const data = await getKepsekData(activeUnitId, activeYearId)
  return (
    <div className="max-w-7xl mx-auto w-full">
      <KepsekDashboard activeUnit={activeUnit} activeYear={activeYear} {...data} />
    </div>
  )
}
