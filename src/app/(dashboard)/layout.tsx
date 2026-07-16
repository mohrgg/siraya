import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Fetch school units and academic years for the global header
  const schoolUnits = await prisma.schoolUnit.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  })

  // For the active academic year, we might just fetch all and let the client filter or select
  // We'll pass all active academic years.
  const academicYears = await prisma.academicYear.findMany({
    where: { isActive: true },
    select: { id: true, name: true, schoolUnitId: true }
  })

  return (
    <div className="dashboard-container">
      <Sidebar user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        avatar: session.user.avatar
      }} />
      <div className="dashboard-main">
        <Header 
          user={{
            name: session.user.name,
            role: session.user.role,
            avatar: session.user.avatar
          }}
          schoolUnits={schoolUnits}
          academicYears={academicYears}
        />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}
