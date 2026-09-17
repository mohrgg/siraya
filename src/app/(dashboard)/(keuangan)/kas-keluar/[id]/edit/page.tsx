import { getKasKeluarById, getKasBankAccounts, getPengeluaranAccounts, getDivisiList, getPenggunaList } from "@/actions/kas-keluar"
import EditKasKeluarClient from "./EditKasKeluarClient"
import { notFound } from "next/navigation"

export default async function EditKasKeluarPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const transaksi = await getKasKeluarById(resolvedParams.id)
    const kasBankAccounts = await getKasBankAccounts(transaksi.unitSekolahId || undefined)
    const pengeluaranAccounts = await getPengeluaranAccounts(transaksi.unitSekolahId || undefined)
    const divisiList = await getDivisiList()
    const penggunaList = await getPenggunaList()
    
    return (
      <EditKasKeluarClient 
        transaksi={transaksi} 
        kasBankAccounts={kasBankAccounts} 
        pengeluaranAccounts={pengeluaranAccounts} 
        divisiList={divisiList}
        penggunaList={penggunaList}
      />
    )
  } catch (error) {
    notFound()
  }
}
