import LaporanTunggakanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function LaporanTunggakanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  return <LaporanTunggakanClient />
}
