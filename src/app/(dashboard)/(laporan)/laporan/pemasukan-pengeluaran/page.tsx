import LaporanPemasukanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getPengaturan } from "@/actions/pengaturan"

export const dynamic = 'force-dynamic'

export default async function LaporanPemasukanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const unitName = user?.unitSekolahName || "SEMUA UNIT"
  const pengaturan = await getPengaturan()
  
  return <LaporanPemasukanClient initialUnitName={unitName} pengaturan={pengaturan} />
}
