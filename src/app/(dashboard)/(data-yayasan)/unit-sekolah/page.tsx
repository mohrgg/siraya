import { getUnitSekolah } from "@/actions/unit-sekolah"
import UnitSekolahClient from "./UnitSekolahClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/ui/PageHeader"

export default async function UnitSekolahPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  if (tenant.role !== "ADMIN" && tenant.role !== "YAYASAN") {
    redirect("/")
  }

  const data = await getUnitSekolah()

  return (
    <div className="w-full">
      <PageHeader 
        title="Unit Sekolah"
        subtitle="Kelola konfigurasi institusi dan data operasional unit pendidikan di bawah Yayasan Al Basyariah"
      />
      <UnitSekolahClient initialData={data} userRole={session?.user?.role} />
    </div>
  )
}
