import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import GuruDetailClient from "./GuruDetailClient"
import { auth } from "@/lib/auth"

export default async function GuruDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const { id } = await params

  const [guru, pengaturan] = await Promise.all([
    prisma.guru.findUnique({
      where: { id: id, isDeleted: false },
      include: {
        unitSekolah: true,
        rombelWali: true
      }
    }),
    prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
  ])

  if (!guru) {
    notFound()
  }

  const isReadOnly = (session.user as any)?.role === "KEPALA_SEKOLAH"

  return <GuruDetailClient initialData={guru} isReadOnly={isReadOnly} pengaturan={pengaturan} userName={session.user.name || undefined} />
}
