import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasKeluar } from "@/actions/kas-keluar"
import { getPengaturan } from "@/actions/pengaturan"
import KasKeluarClient from "./KasKeluarClient"

export default async function KasKeluarPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const initialData = await getKasKeluar()
  const pengaturan = await getPengaturan()

  return <KasKeluarClient initialData={initialData} userRole={(session.user as any).role} pengaturan={pengaturan} />
}
