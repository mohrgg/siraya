import { getJurusan } from "@/actions/kelas"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import JurusanClient from "./JurusanClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

import { PageHeader } from "@/components/ui/PageHeader"

export default async function JurusanPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  const activeUnitId = tenant.unitId || undefined

  const [data, units] = await Promise.all([
    getJurusan(activeUnitId),
    getUnitSekolah()
  ])

  return (
    <div className="w-full">
      <PageHeader 
        title="Program / Jurusan"
        subtitle="Kelola program keahlian atau jurusan untuk unit sekolah (khusus SMK / setara)"
      />
      <JurusanClient 
        initialData={data} 
        userRole={session?.user?.role} 
        activeUnitId={activeUnitId} 
        units={units}
      />
    </div>
  )
}
