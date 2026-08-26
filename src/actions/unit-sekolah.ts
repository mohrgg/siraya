"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getUnitSekolah() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const units = await prisma.unitSekolah.findMany({
    orderBy: { name: "asc" }
  })

  // Urutan hierarki level sekolah
  const levelOrder: Record<string, number> = {
    'TK': 1,
    'SD': 2,
    'SMP': 3,
    'MTS': 3,
    'SMA': 4,
    'SMK': 5,
    'MA': 5,
  }

  return units.sort((a, b) => {
    const levelA = levelOrder[a.level?.toUpperCase()] || 99
    const levelB = levelOrder[b.level?.toUpperCase()] || 99
    
    if (levelA !== levelB) {
      return levelA - levelB
    }
    
    return a.name.localeCompare(b.name)
  })
}

export async function tambahUnitSekolah(data: { name: string, level: string, address?: string, phone?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.create({ data })
  revalidatePath("/data-master")
  revalidatePath("/") // revalidate dashboard
  return result
}

export async function editUnitSekolah(id: string, data: { name?: string, level?: string, address?: string, phone?: string, email?: string, website?: string, namaKepalaSekolah?: string, nipKepalaSekolah?: string, kotaPenandatangan?: string, isActive?: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.update({
    where: { id },
    data
  })
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function hapusUnitSekolah(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.delete({
    where: { id }
  })
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}
