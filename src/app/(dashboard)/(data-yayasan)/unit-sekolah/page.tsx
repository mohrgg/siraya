import { getUnitSekolah } from "@/actions/unit-sekolah"
import UnitSekolahClient from "./UnitSekolahClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"
import { redirect } from "next/navigation"

export default async function UnitSekolahPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  if (tenant.role !== "ADMIN" && tenant.role !== "YAYASAN") {
    redirect("/")
  }

  const data = await getUnitSekolah()

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Unit Sekolah</h1>
        <p className="text-text-muted">Kelola unit sekolah di bawah naungan Yayasan Al Basyariah</p>
      </div>
      <UnitSekolahClient initialData={data} userRole={session?.user?.role} />
    </div>
  )
}
