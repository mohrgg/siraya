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
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Kelas & Murid</h1>
        <p className="page-subtitle">Kelola data rombongan belajar dan data siswa</p>
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
