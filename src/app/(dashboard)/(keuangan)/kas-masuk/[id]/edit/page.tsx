import { getKasMasukById, getKasBankAccounts, getPendapatanAccounts } from "@/actions/kas-masuk"
import EditKasMasukClient from "./EditKasMasukClient"
import { notFound } from "next/navigation"

export default async function EditKasMasukPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const transaksi = await getKasMasukById(resolvedParams.id)
    const kasBankAccounts = await getKasBankAccounts(transaksi.unitSekolahId || undefined)
    const pendapatanAccounts = await getPendapatanAccounts(transaksi.unitSekolahId || undefined)
    
    return (
      <EditKasMasukClient 
        transaksi={transaksi} 
        kasBankAccounts={kasBankAccounts} 
        pendapatanAccounts={pendapatanAccounts} 
      />
    )
  } catch (error) {
    notFound()
  }
}
