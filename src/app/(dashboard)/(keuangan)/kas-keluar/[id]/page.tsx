import { getKasKeluarById } from "@/actions/kas-keluar"
import KasKeluarDetailClient from "./KasKeluarDetailClient"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function KasKeluarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const [transaksi, pengaturan] = await Promise.all([
      getKasKeluarById(resolvedParams.id),
      prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
    ])
    return <KasKeluarDetailClient transaksi={transaksi} pengaturan={pengaturan} />
  } catch (error) {
    notFound()
  }
}
