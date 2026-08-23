import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasMasuk } from "@/actions/kas-masuk"
import { getPengaturan, getUnitSekolahList } from "@/actions/pengaturan"
import KasMasukClient from "./KasMasukClient"
import { getTenantContext } from "@/lib/tenant"

export default async function KasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  const tenant = await getTenantContext()
  
  const initialData = await getKasMasuk()
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolahList()
  const userUnitId = tenant.unitId === "all" || tenant.unitId === null ? undefined : tenant.unitId

  return <KasMasukClient initialData={initialData} userRole={(session.user as any).role} pengaturan={pengaturan} schoolUnits={schoolUnits} userUnitId={userUnitId} userName={session.user.name || undefined} />
}
