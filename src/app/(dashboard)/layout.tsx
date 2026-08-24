import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { MobileMenuProvider } from "@/components/layout/MobileMenuContext"
import { UserActivityTracker } from "@/components/UserActivityTracker"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantContext()
  
  const userRole = tenant.role
  const userUnitId = tenant.unitId

  // Fetch school units: Admin gets all, others get only their assigned unit
  const schoolUnits = await prisma.unitSekolah.findMany({
    where: { 
      isActive: true,
      ...(userRole !== "ADMIN" && userUnitId ? { id: userUnitId } : {})
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  })

  // For the header dropdown, we load ALL academic years so users can switch context.
  const academicYears = await prisma.tahunAkademik.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "desc" }
  })

  const cookieStore = await cookies()
  
  // Gunakan tenant.unitId (yang mana aman dari bocor), dan fallback "all" jika Admin
  let activeUnitId = tenant.unitId || "all"

  const activeYearId = cookieStore.get("activeYearId")?.value || academicYears.find((y: any) => y.isActive)?.id || academicYears[0]?.id

  return (
    <MobileMenuProvider>
      <div className="flex h-screen w-full bg-bg overflow-hidden relative">
        <Sidebar user={{
          name: tenant.user.name,
          email: tenant.user.email,
          role: tenant.role,
          avatar: tenant.user.avatar
        }} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header 
            user={{
              name: tenant.user.name,
              role: tenant.role,
              avatar: tenant.user.avatar
            }}
            schoolUnits={schoolUnits}
            academicYears={academicYears}
            activeUnitId={activeUnitId}
            activeYearId={activeYearId}
          />
          <UserActivityTracker />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  )
}
