import { getTingkatan, getJurusan, getKelas } from "@/actions/kelas"
import { getSiswa } from "@/actions/siswa"
import { getTahunAkademik } from "@/actions/tahun-akademik"
import { getGuruList } from "@/actions/guru"
import KelasClient from "./KelasClient"
import prisma from "@/lib/prisma"

import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

export default async function KelasPage() {
  const session = await auth()
  const userName = session?.user?.name || undefined
  let schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const levelOrder: Record<string, number> = { "SD": 1, "SMP": 2, "SMA": 3, "SMK": 4, "MA": 5 }
  schoolUnits = schoolUnits.sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99))
  
  const cookieStore = await cookies()
  const activeUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
  const academicYears = await getTahunAkademik()
  const activeYearId = cookieStore.get("activeYearId")?.value || academicYears.find((y: any) => y.isActive)?.id

  const grades = await getTingkatan(activeUnitId)
  const majors = await getJurusan()
  const classrooms = await getKelas(activeUnitId, activeYearId)
  const teachers = await getGuruList()
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
  const students: any[] = [] // Now fetched asynchronously in KelasClient via pagination

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Kelas & Murid</h1>
        <p className="text-text-muted">Kelola data rombongan belajar dan data siswa</p>
      </div>

      <KelasClient 
        activeUnitId={activeUnitId}
        activeYearId={activeYearId}
        initialGrades={grades}
        initialMajors={majors}
        initialClassrooms={classrooms}
        initialStudents={students}
        academicYears={academicYears}
        schoolUnits={schoolUnits}
        initialTeachers={teachers}
        userRole={session?.user?.role}
        userName={userName}
        pengaturan={pengaturan}
      />
    </div>
  )
}
