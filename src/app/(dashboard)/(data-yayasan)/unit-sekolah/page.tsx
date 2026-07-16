import { getUnitSekolah } from "@/actions/unit-sekolah"
import UnitSekolahClient from "./UnitSekolahClient"

export default async function UnitSekolahPage() {
  const data = await getUnitSekolah()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Unit Sekolah</h1>
        <p className="page-subtitle">Kelola data unit sekolah dalam yayasan</p>
      </div>
      <UnitSekolahClient initialData={data} />
    </div>
  )
}
