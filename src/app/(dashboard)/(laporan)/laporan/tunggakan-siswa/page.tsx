import LaporanTunggakanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import { getTingkatan, getKelas } from "@/actions/kelas"

export const dynamic = 'force-dynamic'

export default async function LaporanTunggakanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolah()
  const grades = await getTingkatan()
  const classrooms = await getKelas()
  
  return <LaporanTunggakanClient 
    pengaturan={pengaturan} 
    schoolUnits={schoolUnits}
    grades={grades}
    classrooms={classrooms}
    userRole={user.role}
    userUnitId={user.unitSekolahId}
  />
}
