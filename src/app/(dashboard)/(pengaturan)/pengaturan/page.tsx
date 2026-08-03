import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPengaturan } from "@/actions/pengaturan"
import PengaturanClient from "./Client"

export const dynamic = 'force-dynamic'

export default async function PengaturanPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const initialSettings = await getPengaturan()

  return <PengaturanClient initialSettings={initialSettings} />
}
