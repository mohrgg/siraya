import { getGuruList } from "@/actions/guru"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import GuruClient from "./GuruClient"
import { getTenantContext } from "@/lib/tenant"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function GuruPage() {
  const tenant = await getTenantContext()

  const [data, schoolUnits, pengaturan] = await Promise.all([
    getGuruList(),
    getUnitSekolah(),
    prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
  ])

  // activeUnitId is null when in Global mode
  const activeUnitId = tenant.unitId || "all"

  const isKepsek = tenant.role === "KEPALA_SEKOLAH"
  const isYayasan = tenant.role === "YAYASAN"

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          {isYayasan
            ? "Direktori Guru & Staf"
            : isKepsek
            ? "Beban & Direktori Guru"
            : "Guru & Staf"}
        </h1>
        <p className="text-text-muted">
          {isYayasan
            ? "Pengawasan kualifikasi, status kepegawaian, dan penugasan wali kelas lintas unit"
            : isKepsek
            ? "Monitoring kualifikasi, status kepegawaian, dan penugasan wali kelas unit"
            : "Kelola data kepegawaian, pengampu mata pelajaran, dan wali kelas"}
        </p>
      </div>
      <GuruClient 
        initialData={data} 
        schoolUnits={schoolUnits} 
        userRole={tenant.role} 
        activeUnitId={activeUnitId}
        pengaturan={pengaturan}
        userName={tenant.user.name || undefined}
      />
    </div>
  )
}
