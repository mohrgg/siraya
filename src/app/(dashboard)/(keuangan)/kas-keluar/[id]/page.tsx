import { getKasKeluarById } from "@/actions/kas-keluar"
import KasKeluarDetailClient from "./KasKeluarDetailClient"
import { notFound } from "next/navigation"

export default async function KasKeluarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const transaksi = await getKasKeluarById(resolvedParams.id)
    return <KasKeluarDetailClient transaksi={transaksi} />
  } catch (error) {
    notFound()
  }
}
