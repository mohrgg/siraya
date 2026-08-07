import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasBankAccounts, getPendapatanAccounts } from "@/actions/kas-masuk"
import { getUnitSekolahList } from "@/actions/pengaturan"
import TambahKasMasukClient from "./TambahKasMasukClient"

export default async function TambahKasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const kasBankAccounts = await getKasBankAccounts()
  const pendapatanAccounts = await getPendapatanAccounts()
  const schoolUnits = await getUnitSekolahList()

  return <TambahKasMasukClient 
    kasBankAccounts={kasBankAccounts} 
    pendapatanAccounts={pendapatanAccounts}
    schoolUnits={schoolUnits}
    userUnitId={(session.user as any).unitSekolahId}
  />
}
