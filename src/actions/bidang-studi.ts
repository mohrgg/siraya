"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getBidangStudiList(unitSekolahId: string) {
  try {
    const list = await (prisma as any).bidangStudi.findMany({
      where: {
        unitSekolahId,
        isDeleted: false
      },
      orderBy: {
        name: 'asc'
      }
    })
    return { data: list, error: null }
  } catch (error: any) {
    console.error("Error fetching BidangStudi:", error)
    return { data: [], error: error.message }
  }
}

export async function createBidangStudi(name: string, unitSekolahId: string) {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    // Cek apakah sudah ada untuk menghindari duplikat (termasuk yang soft-deleted)
    const existing = await (prisma as any).bidangStudi.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        unitSekolahId
      }
    })

    let created;
    if (existing) {
      if (!existing.isDeleted) {
        return { data: existing, error: null }
      } else {
        // Restore soft-deleted record
        created = await (prisma as any).bidangStudi.update({
          where: { id: existing.id },
          data: { isDeleted: false }
        })
      }
    } else {
      created = await (prisma as any).bidangStudi.create({
        data: { name, unitSekolahId }
      })
    }

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "TAMBAH_BIDANG_STUDI",
        modul: "KEPEGAWAIAN",
        keterangan: `Menambahkan bidang studi baru: ${name}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { data: created, error: null }
  } catch (error: any) {
    console.error("Error creating BidangStudi:", error)
    return { data: null, error: error.message || "Gagal menyimpan Bidang Studi" }
  }
}

export async function deleteBidangStudi(id: string) {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const existing = await (prisma as any).bidangStudi.findUnique({ where: { id } })
    if (!existing) throw new Error("Data tidak ditemukan")

    // Soft delete
    await (prisma as any).bidangStudi.update({
      where: { id },
      data: { isDeleted: true }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "HAPUS_BIDANG_STUDI",
        modul: "KEPEGAWAIAN",
        keterangan: `Menghapus bidang studi: ${existing.name}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting BidangStudi:", error)
    return { success: false, error: error.message || "Gagal menghapus Bidang Studi" }
  }
}
