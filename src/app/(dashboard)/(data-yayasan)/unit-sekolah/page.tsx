import { getUnitSekolah } from "@/actions/unit-sekolah"
import UnitSekolahClient from "./UnitSekolahClient"
import { auth } from "@/lib/auth"

export default async function UnitSekolahPage() {
  const session = await auth()
  const data = await getUnitSekolah()

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Unit Sekolah</h1>
        <p className="text-text-muted">Kelola unit sekolah di bawah naungan Yayasan Al Basyariah</p>
      </div>
      <UnitSekolahClient initialData={data} userRole={session?.user?.role} />
    </div>
  )
}
