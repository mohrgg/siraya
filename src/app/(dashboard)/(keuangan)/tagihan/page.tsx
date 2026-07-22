import TagihanClient from "./TagihanClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { getJenisTagihan, getTagihanPerMurid } from "@/actions/tagihan"

export default async function TagihanPage() {
  const cookieStore = await cookies()
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const unitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id

  const tahunAkademik = await prisma.tahunAkademik.findMany({
    orderBy: { createdAt: "desc" }
  })
  const activeTahun = tahunAkademik.find(t => t.isActive) || tahunAkademik[0]
  const tahunId = activeTahun?.id || ""

  const jenisTagihan = tahunId ? await getJenisTagihan(unitId, tahunId) : []
  const daftarTagihan = tahunId ? await getTagihanPerMurid(unitId, tahunId) : []

  // Ambil sub kelas untuk filter dropdown
  const subKelasList = await prisma.subKelas.findMany({
    where: { unitSekolahId: unitId, tahunAkademikId: tahunId },
    include: { tingkat: { select: { name: true, order: true } } },
    orderBy: { tingkat: { order: "asc" } }
  })

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Tagihan Siswa</h1>
        <p className="text-text-muted">Kelola jenis tagihan, generate tagihan batch, dan pantau status pembayaran</p>
      </div>

      <TagihanClient
        initialJenisTagihan={jenisTagihan}
        initialDaftarTagihan={daftarTagihan}
        unitId={unitId}
        tahunId={tahunId}
        tahunAkademik={tahunAkademik}
        kelasList={subKelasList}
      />
    </div>
  )
}
