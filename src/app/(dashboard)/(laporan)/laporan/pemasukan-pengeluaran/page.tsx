import LaporanPemasukanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function LaporanPemasukanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  return <LaporanPemasukanClient />
}
