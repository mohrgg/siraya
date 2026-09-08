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
  const isReadOnly = role === "KEPALA_SEKOLAH" || role === "YAYASAN"

  const res = await getMuridDetail360(id)
  if (!res.success || !res.data) {
    notFound()
  }

  const [schoolUnits, classrooms, pengaturan] = await Promise.all([
    prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } }),
    prisma.subKelas.findMany({
      include: { tingkat: true, unitSekolah: true, tahunAkademik: true },
      orderBy: { name: 'asc' }
    }),
    prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
  ])

  return (
    <div className="max-w-[1600px] mx-auto w-full pb-12 animate-in fade-in duration-300">
      <MuridDetailClient 
        initialMurid={res.data} 
        isReadOnly={isReadOnly} 
        role={role}
        schoolUnits={schoolUnits}
        classrooms={classrooms}
        pengaturan={pengaturan}
        userName={session?.user?.name || undefined}
      />
    </div>
  )
}
