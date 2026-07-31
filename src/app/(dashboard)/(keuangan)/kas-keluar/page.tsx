import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasKeluar } from "@/actions/kas-keluar"
import KasKeluarClient from "./KasKeluarClient"

export default async function KasKeluarPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  // Initial data load for today/this month can be handled on client side,
  // or we can just fetch all and filter client side.
  // Given potential volume, server-side filtering is better. We'll let Client component refetch.
  const initialData = await getKasKeluar()

  return <KasKeluarClient initialData={initialData} userRole={(session.user as any).role} />
}
