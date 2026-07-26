import { getGuruList } from "@/actions/guru"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import GuruClient from "./GuruClient"
import { auth } from "@/lib/auth"

export default async function GuruPage() {
  const session = await auth()
  const [data, schoolUnits] = await Promise.all([
    getGuruList(),
    getUnitSekolah()
  ])

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Guru & Staf</h1>
        <p className="text-text-muted">Kelola data kepegawaian, pengampu mata pelajaran, dan wali kelas</p>
      </div>
      <GuruClient initialData={data} schoolUnits={schoolUnits} userRole={session?.user?.role} />
    </div>
  )
}
