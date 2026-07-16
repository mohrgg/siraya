import { getUnitSekolah } from "@/actions/unit-sekolah"
import UnitSekolahClient from "./UnitSekolahClient"

export default async function UnitSekolahPage() {
  const data = await getUnitSekolah()

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Unit Sekolah</h1>
        <p className="text-text-muted">Kelola data unit sekolah dalam yayasan</p>
      </div>
      <UnitSekolahClient initialData={data} />
    </div>
  )
}
