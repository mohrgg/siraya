import { getKasMasukById } from "@/actions/kas-masuk"
import KasMasukDetailClient from "./KasMasukDetailClient"
import { notFound } from "next/navigation"

export default async function KasMasukDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const transaksi = await getKasMasukById(resolvedParams.id)
    return <KasMasukDetailClient transaksi={transaksi} />
  } catch (error) {
    notFound()
  }
}
