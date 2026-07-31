import { getJurusan } from "@/actions/kelas"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import JurusanClient from "./JurusanClient"
import { auth } from "@/lib/auth"

export default async function JurusanPage() {
  const session = await auth()
  const [data, units] = await Promise.all([
    getJurusan(),
    getUnitSekolah()
  ])

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Program / Jurusan</h1>
        <p className="text-text-muted">Kelola program keahlian atau jurusan untuk unit sekolah (khusus SMK / setara)</p>
      </div>
      <JurusanClient initialData={data} units={units} userRole={session?.user?.role} />
    </div>
  )
}
