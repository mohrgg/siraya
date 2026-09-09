import { getTingkatan, getJurusan, getKelas } from "@/actions/kelas"
import { getSiswa } from "@/actions/siswa"
import { getTahunAkademik } from "@/actions/tahun-akademik"
import { getGuruList } from "@/actions/guru"
import KelasClient from "./KelasClient"
import prisma from "@/lib/prisma"

import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

import { PageHeader } from "@/components/ui/PageHeader"

export default async function KelasPage() {
  const tenant = await getTenantContext()
  const userName = tenant.user?.name || undefined
  let schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const levelOrder: Record<string, number> = { "SD": 1, "SMP": 2, "SMA": 3, "SMK": 4, "MA": 5 }
  schoolUnits = schoolUnits.sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99))
  
  const cookieStore = await cookies()
  const activeUnitId = tenant.unitId || "all"
  const academicYears = await getTahunAkademik()
  const activeYearId = cookieStore.get("activeYearId")?.value || academicYears.find((y: any) => y.isActive)?.id

  const grades = await getTingkatan(activeUnitId)
  const majors = await getJurusan()
  const classrooms = await getKelas(activeUnitId, activeYearId)
  const teachers = await getGuruList()
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
  const students: any[] = [] // Now fetched asynchronously in KelasClient via pagination

  const isKepsek = tenant.role === "KEPALA_SEKOLAH"
  const isYayasan = tenant.role === "YAYASAN"

  const pageTitle = isYayasan
    ? "Direktori Kelas & Rombel"
    : isKepsek
    ? "Kapasitas & Distribusi Rombel"
    : "Kelas & Murid"

  const pageSubtitle = isYayasan
    ? "Pengawasan kapasitas rombongan belajar, rasio siswa, dan penugasan wali kelas lintas unit"
    : isKepsek
    ? "Monitoring daya tampung rombongan belajar, rasio murid, dan penugasan wali kelas"
    : "Kelola data rombongan belajar dan data siswa"

  return (
    <div className="w-full">
      <PageHeader 
        title={pageTitle}
        subtitle={pageSubtitle}
      />

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
        userRole={tenant.role}
        userName={userName}
        pengaturan={pengaturan}
      />
    </div>
  )
}
