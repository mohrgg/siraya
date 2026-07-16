import { getTingkatan, getJurusan, getKelas } from "@/actions/kelas"
import { getSiswa } from "@/actions/siswa"
import { getTahunAkademik } from "@/actions/tahun-akademik"
import KelasClient from "./KelasClient"
import prisma from "@/lib/prisma"

import { cookies } from "next/headers"

export default async function KelasPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  const cookieStore = await cookies()
  const activeUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id

  const grades = await getTingkatan(activeUnitId)
  const majors = await getJurusan()
  const classrooms = await getKelas(activeUnitId)
  const students = activeUnitId ? await getSiswa(activeUnitId) : []
  const academicYears = await getTahunAkademik(activeUnitId)

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Kelas & Murid</h1>
        <p className="text-text-muted">Kelola data rombongan belajar dan data siswa</p>
      </div>

      <KelasClient 
        activeUnitId={activeUnitId}
        initialGrades={grades}
        initialMajors={majors}
        initialClassrooms={classrooms}
        initialStudents={students}
        academicYears={academicYears}
        schoolUnits={schoolUnits}
      />
    </div>
  )
}
