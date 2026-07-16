import { getJurusan } from "@/actions/kelas"
import JurusanClient from "./JurusanClient"

export default async function JurusanPage() {
  const data = await getJurusan()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Program & Jurusan</h1>
        <p className="page-subtitle">Kelola program keahlian dan jurusan</p>
      </div>
      <JurusanClient initialData={data} />
    </div>
  )
}
