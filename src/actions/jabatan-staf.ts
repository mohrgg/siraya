"use server"

import defaultPrisma from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

const getPrisma = () => {
  if ((defaultPrisma as any)?.jabatanStaf) return defaultPrisma
  return new PrismaClient()
}

export interface JabatanStafItem {
  id: string
  name: string
}

const JABATAN_STAF_DEFAULT_LIST = [
  "Kepala Tata Usaha",
  "Staf Administrasi / Tata Usaha",
  "Bendahara / Staf Keuangan",
  "Operator Dapodik & IT",
  "Pustakawan / Staf Perpustakaan",
  "Laboran / Teknisi",
  "Tenaga Keamanan (Satpam)",
  "Tenaga Kebersihan (Cleaning Service / OB)",
  "Petugas Sarana & Prasarana"
] as const

/**
 * Mengambil daftar jabatan staf.
 * Auto-seed jabatan standar jika tabel masih kosong.
 */
export async function getJabatanStafList(): Promise<{ data: JabatanStafItem[]; error: string | null }> {
  try {
    const prisma = getPrisma()
    let list = await (prisma as any).jabatanStaf.findMany({
      orderBy: { name: "asc" }
    })

    if (list.length === 0) {
      for (const name of JABATAN_STAF_DEFAULT_LIST) {
        await (prisma as any).jabatanStaf.upsert({
          where: { name },
          create: { name },
          update: {}
        })
      }

      list = await (prisma as any).jabatanStaf.findMany({
        orderBy: { name: "asc" }
      })
    }

    return { data: list, error: null }
  } catch (error: any) {
    console.error("Error fetching JabatanStaf:", error)
    return { data: [], error: error.message || "Gagal memuat daftar jabatan staf" }
  }
}

/**
 * Menambahkan jabatan staf baru.
 */
export async function createJabatanStaf(rawName: string): Promise<{ success: boolean; data?: JabatanStafItem; error: string | null }> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const prisma = getPrisma()

    const trimmed = (rawName || "").trim()
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: "Nama jabatan minimal 2 karakter" }
    }

    // Cek apakah sudah ada (case-insensitive)
    const existing = await (prisma as any).jabatanStaf.findFirst({
      where: {
        name: { equals: trimmed, mode: "insensitive" }
      }
    })

    if (existing) {
      return { success: true, data: existing, error: null }
    }

    const created = await (prisma as any).jabatanStaf.create({
      data: { name: trimmed }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "TAMBAH_JABATAN_STAF",
        modul: "KEPEGAWAIAN",
        keterangan: `Menambahkan jabatan staf: ${trimmed}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, data: created, error: null }
  } catch (error: any) {
    console.error("Error creating JabatanStaf:", error)
    return { success: false, error: error.message || "Gagal menambahkan jabatan staf" }
  }
}

/**
 * Menghapus jabatan staf.
 * SYARAT: Jabatan hanya dapat dihapus jika TIDAK ADA staf yang sedang menggunakannya.
 */
export async function deleteJabatanStaf(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const prisma = getPrisma()

    const existing = await (prisma as any).jabatanStaf.findUnique({
      where: { id }
    })

    if (!existing) {
      return { success: false, error: "Data jabatan tidak ditemukan" }
    }

    // Periksa apakah ada pegawai ber-jenisPtk STAF yang menggunakan jabatan ini
    const inUseCount = await prisma.guru.count({
      where: {
        jabatan: { equals: existing.name, mode: "insensitive" },
        isDeleted: false
      }
    })

    if (inUseCount > 0) {
      return {
        success: false,
        error: `Jabatan "${existing.name}" tidak dapat dihapus karena masih digunakan oleh ${inUseCount} staf.`
      }
    }

    await (prisma as any).jabatanStaf.delete({
      where: { id }
    })

    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi: "HAPUS_JABATAN_STAF",
        modul: "KEPEGAWAIAN",
        keterangan: `Menghapus jabatan staf: ${existing.name}`
      }
    })

    revalidatePath("/(dashboard)/(data-akademik)/guru", "layout")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting JabatanStaf:", error)
    return { success: false, error: error.message || "Gagal menghapus jabatan staf" }
  }
}
