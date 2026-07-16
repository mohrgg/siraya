import { getTahunAkademik } from "@/actions/tahun-akademik"
import TahunAkademikClient from "./TahunAkademikClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

export default async function TahunAkademikPage() {
  const data = await getTahunAkademik()

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Tahun Akademik</h1>
        <p className="page-subtitle">Kelola tahun ajaran akademik Yayasan</p>
      </div>
      <TahunAkademikClient initialData={data} />
    </div>
  )
}
