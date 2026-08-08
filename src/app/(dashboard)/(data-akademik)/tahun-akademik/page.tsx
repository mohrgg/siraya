import { getTahunAkademik } from "@/actions/tahun-akademik"
import TahunAkademikClient from "./TahunAkademikClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"
import { redirect } from "next/navigation"

export default async function TahunAkademikPage() {
  const session = await auth()
  const tenant = await getTenantContext()
  
  if (tenant.role !== "ADMIN") {
    redirect("/")
  }

  const data = await getTahunAkademik()

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Tahun Akademik</h1>
        <p className="text-text-muted">Kelola tahun ajaran akademik Yayasan</p>
      </div>
      <TahunAkademikClient initialData={data} userRole={session?.user?.role} />
    </div>
  )
}
