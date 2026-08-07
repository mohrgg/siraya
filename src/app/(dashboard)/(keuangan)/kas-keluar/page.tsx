import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasKeluar } from "@/actions/kas-keluar"
import { getPengaturan, getUnitSekolahList } from "@/actions/pengaturan"
import KasKeluarClient from "./KasKeluarClient"

export default async function KasKeluarPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const initialData = await getKasKeluar()
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolahList()
  const userUnitId = (session.user as any).unitSekolahId

  return <KasKeluarClient initialData={initialData} userRole={(session.user as any).role} pengaturan={pengaturan} schoolUnits={schoolUnits} userUnitId={userUnitId} />
}
