import { getTahunAkademik } from "@/actions/tahun-akademik"
import TahunAkademikClient from "./TahunAkademikClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/ui/PageHeader"

export default async function TahunAkademikPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  if (tenant.role !== "ADMIN" && tenant.role !== "YAYASAN") {
    redirect("/")
  }

  const data = await getTahunAkademik()

  return (
    <div className="w-full">
      <PageHeader 
        title="Tahun Akademik"
        subtitle="Kelola tahun ajaran akademik Yayasan Al Basyariah"
      />
      <TahunAkademikClient initialData={data} userRole={session?.user?.role} />
    </div>
  )
}
