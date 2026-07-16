import { getJurusan } from "@/actions/kelas"
import JurusanClient from "./JurusanClient"

export default async function JurusanPage() {
  const data = await getJurusan()

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Program & Jurusan</h1>
        <p className="text-text-muted">Kelola program keahlian dan jurusan</p>
      </div>
      <JurusanClient initialData={data} />
    </div>
  )
}
