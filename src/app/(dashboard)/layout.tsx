import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { UserActivityTracker } from "@/components/UserActivityTracker"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const userRole = session.user.role
  const userUnitId = (session.user as any).unitSekolahId

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
  
  // Force activeUnitId for non-admins, otherwise read from cookie or default to "all" for Admin
  let activeUnitId = cookieStore.get("activeUnitId")?.value
  
  if (userRole === "ADMIN" && !activeUnitId) {
    activeUnitId = "all"
  } else if (!activeUnitId) {
    activeUnitId = schoolUnits[0]?.id
  }

  if (userRole !== "ADMIN" && userUnitId) {
    activeUnitId = userUnitId
  }

  const activeYearId = cookieStore.get("activeYearId")?.value || academicYears.find((y: any) => y.isActive)?.id || academicYears[0]?.id

  return (
    <div className="flex h-screen w-full bg-bg overflow-hidden">
      <Sidebar user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        avatar: session.user.avatar
      }} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header 
          user={{
            name: session.user.name,
            role: session.user.role,
            avatar: session.user.avatar
          }}
          schoolUnits={schoolUnits}
          academicYears={academicYears}
          activeUnitId={activeUnitId}
          activeYearId={activeYearId}
        />
        <UserActivityTracker />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
