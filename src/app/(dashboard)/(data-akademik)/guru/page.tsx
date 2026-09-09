import { getGuruList } from "@/actions/guru"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import GuruClient from "./GuruClient"
import { getTenantContext } from "@/lib/tenant"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

import { PageHeader } from "@/components/ui/PageHeader"

export default async function GuruPage() {
  const tenant = await getTenantContext()
  const activeUnitId = tenant.unitId || "all"
  const data = await getGuruList(activeUnitId)
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })

  const isKepsek = tenant.role === "KEPALA_SEKOLAH"
  const isYayasan = tenant.role === "YAYASAN"

  const pageTitle = isYayasan
    ? "Direktori Guru & Staf"
    : isKepsek
    ? "Beban & Direktori Guru"
    : "Guru & Staf"

  const pageSubtitle = isYayasan
    ? "Pengawasan kualifikasi, status kepegawaian, dan penugasan wali kelas lintas unit"
    : isKepsek
    ? "Monitoring kualifikasi, status kepegawaian, dan penugasan wali kelas unit"
    : "Kelola data kepegawaian, pengampu mata pelajaran, dan wali kelas"

  return (
    <div className="w-full">
      <PageHeader 
        title={pageTitle}
        subtitle={pageSubtitle}
      />
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
