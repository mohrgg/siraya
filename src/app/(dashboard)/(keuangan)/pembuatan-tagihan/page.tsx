import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PembuatanTagihanClient from "./PembuatanTagihanClient"
import { 
  getTahunAkademikAktif, 
  getTahunAkademikList, 
  getUnitSekolah, 
  getAkunPendapatan 
} from "@/actions/pembuatan-tagihan"

export const dynamic = 'force-dynamic'

export default async function PembuatanTagihanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  
  const [
    tahunAkademikAktif,
    tahunAkademikList,
    unitSekolahList,
    akunPendapatanList
  ] = await Promise.all([
    getTahunAkademikAktif(),
    getTahunAkademikList(),
    getUnitSekolah(),
    getAkunPendapatan()
  ])

  return (
    <PembuatanTagihanClient 
      tahunAkademikAktif={tahunAkademikAktif}
      tahunAkademikList={tahunAkademikList}
      unitSekolahList={unitSekolahList}
      akunPendapatanList={akunPendapatanList}
      user={user}
    />
  )
}
