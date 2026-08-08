import { getKasMasukById } from "@/actions/kas-masuk"
import KasMasukDetailClient from "./KasMasukDetailClient"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function KasMasukDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const [transaksi, pengaturan] = await Promise.all([
      getKasMasukById(resolvedParams.id),
      prisma.pengaturan.findUnique({ where: { id: "GLOBAL" } })
    ])
    return <KasMasukDetailClient transaksi={transaksi} pengaturan={pengaturan} />
  } catch (error) {
    notFound()
  }
}
