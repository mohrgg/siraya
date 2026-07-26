"use server"

import prisma from "@/lib/prisma"

export async function getMuridDetail360(id: string) {
  try {
    const murid = await prisma.murid.findUnique({
      where: { id },
      include: {
        unitSekolah: true,
        riwayatKelas: {
          include: {
            subKelas: {
              include: {
                tingkat: true,
                jurusan: true,
                tahunAkademik: true,
              }
            },
            tahunAkademik: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tagihan: {
          include: {
            jenisTagihan: true,
            pembayaran: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!murid) {
      return { success: false, error: "Data murid tidak ditemukan" }
    }

    // Convert Decimals to string/number for clean client serialization
    const serializedTagihan = murid.tagihan.map(t => {
      const totalPaid = t.pembayaran.reduce((sum, p) => sum + Number(p.amount), 0)
      const amount = Number(t.amount)
      return {
        ...t,
        amount,
        totalPaid,
        remaining: Math.max(0, amount - totalPaid),
        pembayaran: t.pembayaran.map(p => ({
          ...p,
          amount: Number(p.amount)
        }))
      }
    })

    // Calculate overall financial summary
    const totalTagihan = serializedTagihan.reduce((sum, t) => sum + t.amount, 0)
    const totalTerbayar = serializedTagihan.reduce((sum, t) => sum + t.totalPaid, 0)
    const sisaTunggakan = Math.max(0, totalTagihan - totalTerbayar)

    const serializedMurid = {
      ...murid,
      tagihan: serializedTagihan,
      summaryKeuangan: {
        totalTagihan,
        totalTerbayar,
        sisaTunggakan
      }
    }

    return { success: true, data: serializedMurid }
  } catch (error: any) {
    console.error("Error fetching 360 student profile:", error)
    return { success: false, error: error.message || "Gagal mengambil data profil siswa" }
  }
}
