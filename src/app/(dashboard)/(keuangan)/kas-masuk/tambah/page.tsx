import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasBankAccounts, getPendapatanAccounts } from "@/actions/kas-masuk"
import TambahKasMasukClient from "./TambahKasMasukClient"

export default async function TambahKasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  
  const kasBankAccounts = await getKasBankAccounts()
  const pendapatanAccounts = await getPendapatanAccounts()

  return <TambahKasMasukClient 
    kasBankAccounts={kasBankAccounts} 
    pendapatanAccounts={pendapatanAccounts} 
  />
}
