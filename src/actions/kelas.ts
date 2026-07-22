"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// --- GRADES ---
export async function getTingkatan(unitSekolahId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.tingkat.findMany({
    where: unitSekolahId ? { unitSekolahId } : undefined,
    include: { unitSekolah: true },
    orderBy: { order: "asc" }
  })
}

export async function tambahTingkatan(data: { name: string, order: number, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.tingkat.create({ 
    data: { name: data.name, order: data.order, unitSekolahId: data.unitSekolahId } 
  })
  revalidatePath("/data-master")
  return result
}

// --- MAJORS ---
export async function getJurusan() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.jurusan.findMany({
    include: { unitSekolah: true },
    orderBy: [
      { unitSekolah: { name: "asc" } },
      { name: "asc" }
    ]
  })
}

export async function tambahJurusan(data: { name: string, code: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.jurusan.create({ data })
  revalidatePath("/data-master")
  return result
}

// --- CLASSROOMS ---
export async function getKelas(unitSekolahId?: string, tahunAkademikId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.subKelas.findMany({
    where: {
      ...(unitSekolahId ? { unitSekolahId } : {}),
      ...(tahunAkademikId ? { tahunAkademikId } : {})
    },
    include: {
      unitSekolah: true,
      tingkat: true,
      jurusan: true,
      tahunAkademik: true,
      _count: {
        select: { riwayatKelas: true }
      }
    },
    orderBy: [
      { tingkat: { order: "asc" } },
      { name: "asc" }
    ]
  })
}

export async function tambahKelas(data: { name: string, tingkatId: string, jurusanId?: string, tahunAkademikId: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Ensure jurusanId is null if empty string
  const cleanData = { 
    name: data.name, 
    tingkatId: data.tingkatId, 
    jurusanId: data.jurusanId || null, 
    tahunAkademikId: data.tahunAkademikId, 
    unitSekolahId: data.unitSekolahId 
  }

  const result = await prisma.subKelas.create({ data: cleanData })
  revalidatePath("/data-master")
  return result
}

export async function hapusTingkatan(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const result = await prisma.tingkat.delete({ where: { id } })
  revalidatePath("/data-master")
  return result
}

export async function editJurusan(id: string, data: { name: string, code: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const result = await prisma.jurusan.update({ where: { id }, data })
  revalidatePath("/data-master")
  return result
}

export async function hapusJurusan(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const result = await prisma.jurusan.delete({ where: { id } })
  revalidatePath("/data-master")
  return result
}

export async function editKelas(id: string, data: { name?: string, tingkatId?: string, jurusanId?: string, tahunAkademikId?: string, unitSekolahId?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const cleanData = { ...data, jurusanId: data.jurusanId || null }
  const result = await prisma.subKelas.update({ where: { id }, data: cleanData })
  revalidatePath("/data-master")
  return result
}

export async function hapusKelas(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  const result = await prisma.subKelas.delete({ where: { id } })
  revalidatePath("/data-master")
  return result
}
