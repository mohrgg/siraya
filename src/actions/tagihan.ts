"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"

// ========== JENIS TAGIHAN ==========

export async function getJenisTagihan(unitSekolahId: string, tahunAkademikId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const data = await prisma.jenisTagihan.findMany({
    where: { unitSekolahId, tahunAkademikId },
    include: {
      _count: { select: { tagihan: true } },
      tagihan: {
        select: {
          status: true,
          amount: true,
          pembayaran: {
            select: { amount: true }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  })

  return data.map(d => {
    const totalTagihan = d.tagihan.length
    const totalLunas = d.tagihan.filter(t => t.status === "PAID").length
    const totalNominal = d.tagihan.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalTerbayar = d.tagihan.reduce((sum, t) => sum + t.pembayaran.reduce((s: number, p: { amount: Prisma.Decimal }) => s + Number(p.amount), 0), 0)

    return {
      id: d.id,
      name: d.name,
      amount: Number(d.amount),
      tahunAkademikId: d.tahunAkademikId,
      unitSekolahId: d.unitSekolahId,
      totalTagihan,
      totalLunas,
      totalNominal,
      totalTerbayar,
      totalTunggakan: totalNominal - totalTerbayar,
    }
  })
}

export async function tambahJenisTagihan(data: {
  name: string, amount: number, tahunAkademikId: string, unitSekolahId: string
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.jenisTagihan.create({
    data: {
      name: data.name,
      amount: new Prisma.Decimal(data.amount),
      tahunAkademikId: data.tahunAkademikId,
      unitSekolahId: data.unitSekolahId,
    }
  })

  revalidatePath("/tagihan")
  return { ...result, amount: Number(result.amount) }
}

export async function editJenisTagihan(id: string, data: { name: string, amount: number }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.jenisTagihan.update({
    where: { id },
    data: { name: data.name, amount: new Prisma.Decimal(data.amount) }
  })
  revalidatePath("/tagihan")
  return { ...result, amount: Number(result.amount) }
}

export async function hapusJenisTagihan(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const hasPayment = await prisma.pembayaran.findFirst({
    where: { tagihan: { jenisTagihanId: id } }
  })
  if (hasPayment) throw new Error("Tidak bisa menghapus jenis tagihan yang sudah memiliki pembayaran")

  await prisma.jenisTagihan.delete({ where: { id } })
  revalidatePath("/tagihan")
}

// ========== GENERATE TAGIHAN BATCH ==========

export async function generateTagihanBatch(jenisTagihanId: string, dueDate?: Date) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const jenisTagihan = await prisma.jenisTagihan.findUniqueOrThrow({
    where: { id: jenisTagihanId }
  })

  // Ambil semua murid aktif di unit ini yang punya riwayat kelas di tahun akademik ini
  const muridAktif = await prisma.murid.findMany({
    where: {
      isActive: true,
      unitSekolahId: jenisTagihan.unitSekolahId,
      riwayatKelas: {
        some: {
          tahunAkademikId: jenisTagihan.tahunAkademikId
        }
      }
    },
    select: { id: true }
  })

  if (muridAktif.length === 0) throw new Error("Tidak ada murid aktif di unit dan tahun akademik ini")

  // Cek mana yang sudah punya tagihan
  const existing = await prisma.tagihan.findMany({
    where: { jenisTagihanId },
    select: { muridId: true }
  })
  const existingIds = new Set(existing.map(e => e.muridId))

  const toCreate = muridAktif.filter(m => !existingIds.has(m.id))

  if (toCreate.length === 0) throw new Error("Semua murid aktif sudah memiliki tagihan ini")

  await prisma.tagihan.createMany({
    data: toCreate.map(m => ({
      jenisTagihanId,
      muridId: m.id,
      amount: jenisTagihan.amount,
      dueDate: dueDate || null,
      status: "UNPAID"
    }))
  })

  revalidatePath("/tagihan")
  return { count: toCreate.length }
}

// ========== TAGIHAN PER MURID ==========

export async function getTagihanPerMurid(
  unitSekolahId: string,
  tahunAkademikId: string,
  filters?: { jenisTagihanId?: string, status?: string, search?: string, kelasId?: string }
) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: any = {
    jenisTagihan: {
      unitSekolahId,
      tahunAkademikId,
      ...(filters?.jenisTagihanId ? { id: filters.jenisTagihanId } : {})
    },
    ...(filters?.status ? { status: filters.status } : {}),
  }

  if (filters?.search) {
    where.murid = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { nisn: { contains: filters.search, mode: "insensitive" } }
      ]
    }
  }

  if (filters?.kelasId) {
    where.murid = {
      ...where.murid,
      riwayatKelas: {
        some: {
          subKelasId: filters.kelasId
        }
      }
    }
  }

  const data = await prisma.tagihan.findMany({
    where,
    include: {
      murid: {
        select: {
          id: true,
          name: true,
          nisn: true,
          riwayatKelas: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              subKelas: {
                include: {
                  tingkat: { select: { name: true } }
                }
              }
            }
          }
        }
      },
      jenisTagihan: { select: { name: true } },
      pembayaran: {
        select: { amount: true, paymentDate: true },
        orderBy: { paymentDate: "desc" }
      }
    },
    orderBy: [
      { murid: { name: "asc" } },
      { jenisTagihan: { name: "asc" } }
    ]
  })

  return data.map(t => {
    const terbayar = t.pembayaran.reduce((sum: number, p) => sum + Number(p.amount), 0)
    const subKelas = t.murid.riwayatKelas[0]?.subKelas
    return {
      id: t.id,
      muridId: t.murid.id,
      muridName: t.murid.name,
      nisn: t.murid.nisn,
      kelasName: subKelas ? `${subKelas.tingkat.name} - ${subKelas.name}` : "-",
      jenisTagihan: t.jenisTagihan.name,
      amount: Number(t.amount),
      terbayar,
      sisa: Number(t.amount) - terbayar,
      status: t.status,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
    }
  })
}

// ========== CETAK TAGIHAN ==========

export async function getTagihanUntukCetak(muridId: string, tahunAkademikId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const murid = await prisma.murid.findUniqueOrThrow({
    where: { id: muridId },
    include: {
      unitSekolah: { select: { name: true } },
      riwayatKelas: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          subKelas: {
            include: { tingkat: { select: { name: true } } }
          }
        }
      }
    }
  })

  const tagihan = await prisma.tagihan.findMany({
    where: {
      muridId,
      jenisTagihan: { tahunAkademikId }
    },
    include: {
      jenisTagihan: { select: { name: true } },
      pembayaran: { select: { amount: true } }
    },
    orderBy: { jenisTagihan: { name: "asc" } }
  })

  const subKelas = murid.riwayatKelas[0]?.subKelas
  return {
    murid: {
      name: murid.name,
      nisn: murid.nisn,
      kelas: subKelas ? `${subKelas.tingkat.name} - ${subKelas.name}` : "-",
      unitSekolah: murid.unitSekolah?.name || "-",
    },
    tagihan: tagihan.map(t => {
      const terbayar = t.pembayaran.reduce((sum: number, p) => sum + Number(p.amount), 0)
      return {
        id: t.id,
        jenisTagihan: t.jenisTagihan.name,
        amount: Number(t.amount),
        terbayar,
        sisa: Number(t.amount) - terbayar,
        status: t.status,
        dueDate: t.dueDate,
      }
    })
  }
}
