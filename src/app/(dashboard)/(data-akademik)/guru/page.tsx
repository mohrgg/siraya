import { getGuruList } from "@/actions/guru"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import GuruClient from "./GuruClient"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function GuruPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const cookieStore = await cookies()
  const activeUnitIdCookie = cookieStore.get("activeUnitId")?.value

  const [data, schoolUnits] = await Promise.all([
    getGuruList(),
    getUnitSekolah()
  ])

  const activeUnitId = activeUnitIdCookie || (user.unitSekolahId ? user.unitSekolahId : (schoolUnits.length > 0 ? schoolUnits[0].id : ""))

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Guru & Staf</h1>
        <p className="text-text-muted">Kelola data kepegawaian, pengampu mata pelajaran, dan wali kelas</p>
      </div>
      <GuruClient 
        initialData={data} 
        schoolUnits={schoolUnits} 
        userRole={session?.user?.role} 
        activeUnitId={activeUnitId} 
      />
    </div>
  )
}
