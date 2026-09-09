"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { logAktivitas } from "@/lib/logger"

export async function getTahunAkademik() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.tahunAkademik.findMany({
    orderBy: {
      name: "desc"
    },
    include: {
      _count: {
        select: {
          subKelas: { where: { isDeleted: false } },
          tagihan: true,
        }
      }
    }
  })
}

export async function setActiveTahunAkademik(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const year = await prisma.tahunAkademik.findUnique({ where: { id } })
  if (!year) throw new Error("Tahun Akademik tidak ditemukan.")

  // Deactivate all others
  await prisma.tahunAkademik.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  })

  // Set active cookie for current user
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  cookieStore.set("activeYearId", id, { path: "/", maxAge: 60 * 60 * 24 * 30 })

  const result = await prisma.tahunAkademik.update({
    where: { id },
    data: { isActive: true },
    include: {
      _count: {
        select: {
          subKelas: { where: { isDeleted: false } },
          tagihan: true,
        }
      }
    }
  })

  await logAktivitas(
    "GANTI_TAHUN_AKADEMIK_AKTIF",
    "PENGATURAN_AKADEMIK",
    `Mengubah tahun akademik aktif yayasan menjadi: ${year.name} (ID: ${id})`
  )

  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function tambahTahunAkademik(data: { name: string, isActive: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  // If new year is set to active, deactivate all others globally
  if (data.isActive) {
    await prisma.tahunAkademik.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })
  }

  const result = await prisma.tahunAkademik.create({
    data,
    include: {
      _count: {
        select: {
          subKelas: { where: { isDeleted: false } },
          tagihan: true,
        }
      }
    }
  })

  if (data.isActive) {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("activeYearId", result.id, { path: "/", maxAge: 60 * 60 * 24 * 30 })
  }
  
  await logAktivitas(
    "TAMBAH_TAHUN_AKADEMIK",
    "PENGATURAN_AKADEMIK",
    `Menambahkan tahun akademik: ${result.name} (Status: ${result.isActive ? "Aktif" : "Non-Aktif"})`
  )

  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function editTahunAkademik(id: string, data: { name: string, isActive: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const year = await prisma.tahunAkademik.findUnique({ where: { id } })
  if (!year) throw new Error("Not found")

  // If this year is set to active, deactivate all others globally
  if (data.isActive) {
    await prisma.tahunAkademik.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })
    
    // Also update the current user's session cookie to reflect the newly activated year
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("activeYearId", id, { path: "/", maxAge: 60 * 60 * 24 * 30 }) // 30 days
  }

  const result = await prisma.tahunAkademik.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          subKelas: { where: { isDeleted: false } },
          tagihan: true,
        }
      }
    }
  })

  await logAktivitas(
    "EDIT_TAHUN_AKADEMIK",
    "PENGATURAN_AKADEMIK",
    `Mengubah tahun akademik: ${result.name} (Status: ${result.isActive ? "Aktif" : "Non-Aktif"})`
  )

  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function hapusTahunAkademik(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Check if it's used
  const usedInClassrooms = await prisma.subKelas.count({ where: { tahunAkademikId: id } })
  if (usedInClassrooms > 0) throw new Error("Tahun Akademik tidak bisa dihapus karena sudah digunakan di data kelas")

  const result = await prisma.tahunAkademik.delete({
    where: { id }
  })
  
  await logAktivitas(
    "HAPUS_TAHUN_AKADEMIK",
    "PENGATURAN_AKADEMIK",
    `Menghapus tahun akademik: ${result.name} (ID: ${id})`
  )

  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}
