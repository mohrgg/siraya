import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasMasuk } from "@/actions/kas-masuk"
import { getPengaturan } from "@/actions/pengaturan"
import KasMasukClient from "./KasMasukClient"

export default async function KasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const initialData = await getKasMasuk()
  const pengaturan = await getPengaturan()

  return <KasMasukClient initialData={initialData} userRole={(session.user as any).role} pengaturan={pengaturan} />
}
