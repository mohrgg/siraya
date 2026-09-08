import { getJurusan } from "@/actions/kelas"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import JurusanClient from "./JurusanClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

export default async function JurusanPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  const activeUnitId = tenant.unitId || undefined

  const [data, units] = await Promise.all([
    getJurusan(activeUnitId),
    getUnitSekolah()
  ])

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Program / Jurusan</h1>
        <p className="text-text-muted">Kelola program keahlian atau jurusan untuk unit sekolah (khusus SMK / setara)</p>
      </div>
      <JurusanClient 
        initialData={data} 
        userRole={session?.user?.role} 
        activeUnitId={activeUnitId} 
        units={units}
      />
    </div>
  )
}
