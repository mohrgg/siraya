"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getKlasifikasiAkun(unitSekolahId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.klasifikasiAkun.findMany({
    where: { unitSekolahId },
    include: {
      subKlasifikasiAkun: {
        include: {
          akunDetail: true
        }
      }
    }
  })
}

export async function tambahKlasifikasiAkun(data: { name: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.klasifikasiAkun.create({ data })
  revalidatePath("/data-master")
  return result
}

export async function tambahSubKlasifikasiAkun(data: { code: string, name: string, klasifikasiAkunId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.subKlasifikasiAkun.create({ data })
  revalidatePath("/data-master")
  return result
}

export async function tambahAkunDetail(data: { code: string, name: string, subKlasifikasiAkunId: string, bankAccountNumber?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.akunDetail.create({ data })
  revalidatePath("/data-master")
  return result
}
