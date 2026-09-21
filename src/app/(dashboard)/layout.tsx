import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import { MobileMenuProvider } from "@/components/layout/MobileMenuContext"
import { UserActivityTracker } from "@/components/UserActivityTracker"
import { ClientErrorTelemetry } from "@/components/ClientErrorTelemetry"

import { sortUnitsByLevel } from "@/lib/constants/units"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantContext()
  
  const userRole = tenant.role
  const userUnitId = tenant.unitId
  const isGlobalRole = userRole === "ADMIN" || userRole === "YAYASAN"

  // Load academic years, school units, dan logo pengaturan yayasan secara paralel
  const [rawSchoolUnits, academicYears, pengaturan] = await Promise.all([
    prisma.unitSekolah.findMany({
      where: { 
        isActive: true,
        ...(!isGlobalRole && userUnitId ? { id: userUnitId } : {})
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, level: true }
    }),
    prisma.tahunAkademik.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { name: "desc" }
    }),
    prisma.pengaturan.findUnique({
      where: { id: "GLOBAL" },
      select: { logoUrl: true }
    })
  ])

  // Urutkan secara kanonikal: SD -> SMP -> SMA -> SMK
  const schoolUnits = sortUnitsByLevel(rawSchoolUnits)

  const cookieStore = await cookies()
  
  // Gunakan tenant.unitId (yang mana aman dari bocor), dan fallback "all" jika Admin
  let activeUnitId = tenant.unitId || "all"

  const activeYearId = cookieStore.get("activeYearId")?.value || academicYears.find((y: any) => y.isActive)?.id || academicYears[0]?.id
  const isSidebarCollapsed = cookieStore.get("siraya_sidebar_collapsed")?.value === "true"

  return (
    <MobileMenuProvider>
      <div className="flex h-[100dvh] w-full bg-bg overflow-hidden relative">
        <Sidebar 
          user={{
            name: tenant.user.name,
            email: tenant.user.email,
            role: tenant.role,
            avatar: tenant.user.avatar,
            mustChangePassword: tenant.user.mustChangePassword
          }} 
          logoUrl={pengaturan?.logoUrl || "/logo.png"}
          initialCollapsed={isSidebarCollapsed}
        />
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
          <ClientErrorTelemetry />
          <main className="flex-1 p-3 sm:p-4 short:p-3 md:p-6 lg:p-8 pb-[calc(4.5rem+env(safe-area-inset-bottom))] short:pb-14 md:pb-8 overflow-y-auto overflow-x-hidden relative">
            {children}
          </main>
        </div>
        <MobileBottomNav 
          user={{
            name: tenant.user.name,
            email: tenant.user.email,
            role: tenant.role,
            avatar: tenant.user.avatar,
            mustChangePassword: tenant.user.mustChangePassword
          }}
          logoUrl={pengaturan?.logoUrl || "/logo.png"}
        />
      </div>
    </MobileMenuProvider>
  )
}
