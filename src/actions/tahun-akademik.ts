"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getTahunAkademik() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.tahunAkademik.findMany({
    orderBy: {
      name: "desc"
    }
  })
}

export async function tambahTahunAkademik(data: { name: string, isActive: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // If new year is set to active, deactivate all others globally
  if (data.isActive) {
    await prisma.tahunAkademik.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })
  }

  const result = await prisma.tahunAkademik.create({
    data
  })
  
  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
  return result
}

export async function editTahunAkademik(id: string, data: { name: string, isActive: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

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
    data
  })

  revalidatePath("/(dashboard)/(data-akademik)/tahun-akademik", "page")
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
  
  revalidatePath("/data-master")
  return result
}
