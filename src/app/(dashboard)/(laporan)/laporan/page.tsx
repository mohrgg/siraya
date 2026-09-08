import LaporanMenuClient from "./LaporanMenuClient"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function LaporanMenuPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  return <LaporanMenuClient userRole={(session.user as any).role} />
}
