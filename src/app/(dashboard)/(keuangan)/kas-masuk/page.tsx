import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasMasuk } from "@/actions/kas-masuk"
import KasMasukClient from "./KasMasukClient"

export default async function KasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  // Initial data load for today/this month can be handled on client side,
  // or we can just fetch all and filter client side.
  // Given potential volume, server-side filtering is better. We'll let Client component refetch.
  const initialData = await getKasMasuk()

  return <KasMasukClient initialData={initialData} userRole={(session.user as any).role} />
}
