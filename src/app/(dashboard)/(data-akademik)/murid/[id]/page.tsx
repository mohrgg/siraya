import { auth } from "@/lib/auth"
import { getMuridDetail360 } from "@/actions/murid-detail"
import MuridDetailClient from "./MuridDetailClient"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MuridDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  const role = session?.user?.role || "TATA_USAHA"
  const isReadOnly = role === "KEPALA_SEKOLAH"

  const res = await getMuridDetail360(id)
  if (!res.success || !res.data) {
    notFound()
  }

  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const classrooms = await prisma.subKelas.findMany({
    include: { tingkat: true, unitSekolah: true, tahunAkademik: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 animate-in fade-in duration-300">
      <MuridDetailClient 
        initialMurid={res.data} 
        isReadOnly={isReadOnly} 
        role={role}
        schoolUnits={schoolUnits}
        classrooms={classrooms}
      />
    </div>
  )
}
