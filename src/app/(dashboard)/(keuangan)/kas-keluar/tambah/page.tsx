import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasBankAccounts, getPengeluaranAccounts, getDivisiList, getPenggunaList } from "@/actions/kas-keluar"
import TambahKasKeluarClient from "./TambahKasKeluarClient"

export default async function TambahKasKeluarPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const kasBankAccounts = await getKasBankAccounts()
  const pengeluaranAccounts = await getPengeluaranAccounts()
  const divisiList = await getDivisiList()
  const penggunaList = await getPenggunaList()

  return (
    <TambahKasKeluarClient 
      kasBankAccounts={kasBankAccounts} 
      pengeluaranAccounts={pengeluaranAccounts} 
      divisiList={divisiList}
      penggunaList={penggunaList}
    />
  )
}
