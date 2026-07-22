import { getJurusan } from "@/actions/kelas"
import JurusanClient from "./JurusanClient"
import prisma from "@/lib/prisma"

export default async function JurusanPage() {
  const data = await getJurusan()
  let schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })

  const levelOrder: Record<string, number> = { "SD": 1, "SMP": 2, "SMA": 3, "SMK": 4, "MA": 5 }
  schoolUnits = schoolUnits.sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99))

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Program & Jurusan</h1>
        <p className="text-text-muted">Kelola program keahlian dan jurusan per unit sekolah</p>
      </div>
      <JurusanClient initialData={data} schoolUnits={schoolUnits} />
    </div>
  )
}
