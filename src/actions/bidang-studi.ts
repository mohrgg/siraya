"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUserAndRole } from "./user-action"

export async function getBidangStudiList(unitSekolahId: string) {
  try {
    const list = await prisma.bidangStudi.findMany({
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
    const session = await getUserAndRole()
    if (!session?.user) throw new Error("Unauthorized")

    // Cek apakah sudah ada untuk menghindari duplikat
    const existing = await prisma.bidangStudi.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        unitSekolahId,
        isDeleted: false
      }
    })

    if (existing) {
      return { data: existing, error: null }
    }

    const created = await prisma.bidangStudi.create({
      data: {
        name,
        unitSekolahId
      }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "CREATE",
        modul: "GURU_STAFF",
        keterangan: `Menambahkan referensi Bidang Studi baru: ${name}`,
        unitSekolahId
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
    const session = await getUserAndRole()
    if (!session?.user) throw new Error("Unauthorized")

    const existing = await prisma.bidangStudi.findUnique({ where: { id } })
    if (!existing) throw new Error("Data tidak ditemukan")

    // Soft delete
    await prisma.bidangStudi.update({
      where: { id },
      data: { isDeleted: true }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "DELETE",
        modul: "GURU_STAFF",
        keterangan: `Menghapus referensi Bidang Studi: ${existing.name}`,
        unitSekolahId: existing.unitSekolahId
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting BidangStudi:", error)
    return { success: false, error: error.message || "Gagal menghapus Bidang Studi" }
  }
}
