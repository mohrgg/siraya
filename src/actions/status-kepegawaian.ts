"use server"

import defaultPrisma from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { STATUS_KEPEGAWAIAN_LIST, normalizeStatusKepegawaian } from "@/lib/constants/kepegawaian"

const getPrisma = () => {
  if ((defaultPrisma as any)?.statusKepegawaian) return defaultPrisma
  return new PrismaClient()
}

export interface StatusKepegawaianItem {
  id: string
  name: string
}

/**
 * Mengambil daftar status kepegawaian terdaftar.
 * Jika tabel masih kosong di database, otomatis melakukan seed awal
 * menggunakan STATUS_KEPEGAWAIAN_LIST standar.
 */
export async function getStatusKepegawaianList(): Promise<{ data: StatusKepegawaianItem[]; error: string | null }> {
  try {
    const prisma = getPrisma()
    let list = await (prisma as any).statusKepegawaian.findMany({
      orderBy: {
        name: "asc"
      }
    })

    if (list.length === 0) {
      // Ambil juga status unik yang mungkin sudah ada di database guru
      const existingGurus = await prisma.guru.findMany({
        where: {
          isDeleted: false,
          statusKepegawaian: {
            notIn: ["-", "", "UNASSIGNED", "Belum Ditentukan"]
          }
        },
        select: { statusKepegawaian: true },
        distinct: ["statusKepegawaian"]
      })

      const seedNames = new Set<string>()
      STATUS_KEPEGAWAIAN_LIST.forEach(s => seedNames.add(s))
      existingGurus.forEach(g => {
        const norm = normalizeStatusKepegawaian(g.statusKepegawaian)
        if (norm && norm !== "UNASSIGNED") {
          seedNames.add(norm)
        }
      })

      for (const name of seedNames) {
        await (prisma as any).statusKepegawaian.upsert({
          where: { name },
          create: { name },
          update: {}
        })
      }

      list = await (prisma as any).statusKepegawaian.findMany({
        orderBy: {
          name: "asc"
        }
      })
    }

    return { data: list, error: null }
  } catch (error: any) {
    console.error("Error fetching StatusKepegawaian:", error)
    return { data: [], error: error.message || "Gagal memuat status kepegawaian" }
  }
}

/**
 * Menambahkan status kepegawaian baru.
 */
export async function createStatusKepegawaian(rawName: string): Promise<{ success: boolean; data?: StatusKepegawaianItem; error: string | null }> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const prisma = getPrisma()

    const trimmed = (rawName || "").trim()
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: "Nama status kepegawaian minimal 2 karakter" }
    }

    if (trimmed === "-" || trimmed.toUpperCase() === "UNASSIGNED" || trimmed.toLowerCase() === "belum ditentukan") {
      return { success: false, error: "Nama status kepegawaian tidak valid" }
    }

    const normalizedName = normalizeStatusKepegawaian(trimmed) || trimmed

    // Cek apakah sudah ada (case-insensitive)
    const existing = await (prisma as any).statusKepegawaian.findFirst({
      where: {
        name: { equals: normalizedName, mode: "insensitive" }
      }
    })

    if (existing) {
      return { success: true, data: existing, error: null }
    }

    const created = await (prisma as any).statusKepegawaian.create({
      data: {
        name: normalizedName
      }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "TAMBAH_STATUS_KEPEGAWAIAN",
        modul: "KEPEGAWAIAN",
        keterangan: `Menambahkan status kepegawaian: ${normalizedName}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, data: created, error: null }
  } catch (error: any) {
    console.error("Error creating StatusKepegawaian:", error)
    return { success: false, error: error.message || "Gagal menambahkan status kepegawaian" }
  }
}

/**
 * Menghapus status kepegawaian.
 * SYARAT: Status hanya dapat dihapus jika TIDAK ADA pegawai yang sedang menggunakannya.
 */
export async function deleteStatusKepegawaian(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const prisma = getPrisma()

    const existing = await (prisma as any).statusKepegawaian.findUnique({
      where: { id }
    })

    if (!existing) {
      return { success: false, error: "Data status kepegawaian tidak ditemukan" }
    }

    // Periksa apakah status ini sedang digunakan oleh pegawai
    const inUseCount = await prisma.guru.count({
      where: {
        statusKepegawaian: {
          equals: existing.name,
          mode: "insensitive"
        },
        isDeleted: false
      }
    })

    if (inUseCount > 0) {
      return {
        success: false,
        error: `Status kepegawaian "${existing.name}" tidak dapat dihapus karena masih digunakan oleh ${inUseCount} pegawai.`
      }
    }

    // Hapus dari database
    await (prisma as any).statusKepegawaian.delete({
      where: { id }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "HAPUS_STATUS_KEPEGAWAIAN",
        modul: "KEPEGAWAIAN",
        keterangan: `Menghapus status kepegawaian: ${existing.name}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting StatusKepegawaian:", error)
    return { success: false, error: error.message || "Gagal menghapus status kepegawaian" }
  }
}
