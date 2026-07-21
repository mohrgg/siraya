"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// Best Practice SIA - Kode Prefix:
// 1 = HARTA/ASET, 2 = KEWAJIBAN, 3 = MODAL/EKUITAS, 4 = PENDAPATAN, 5 = BIAYA/BEBAN

export async function getKlasifikasiAkun(unitSekolahId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.klasifikasiAkun.findMany({
    where: { unitSekolahId },
    orderBy: { code: "asc" },
    include: {
      subKlasifikasiAkun: {
        orderBy: { code: "asc" },
        include: {
          akunDetail: {
            orderBy: { code: "asc" }
          }
        }
      }
    }
  })
}

export async function tambahKlasifikasiAkun(data: { code: string, name: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Validasi kode unik per unit
  const existing = await prisma.klasifikasiAkun.findFirst({
    where: { code: data.code, unitSekolahId: data.unitSekolahId }
  })
  if (existing) throw new Error(`Kode klasifikasi "${data.code}" sudah digunakan`)

  const result = await prisma.klasifikasiAkun.create({ data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function editKlasifikasiAkun(id: string, data: { name: string, code: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.klasifikasiAkun.update({ where: { id }, data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusKlasifikasiAkun(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.klasifikasiAkun.delete({ where: { id } })
  revalidatePath("/akun-keuangan")
}

// Auto-generate kode Sub Klasifikasi: prefix(1digit) + "0000001" → 8 digit
export async function generateSubKlasifikasiCode(klasifikasiAkunId: string): Promise<string> {
  const klasifikasi = await prisma.klasifikasiAkun.findUniqueOrThrow({
    where: { id: klasifikasiAkunId },
    include: { subKlasifikasiAkun: { orderBy: { code: "desc" } } }
  })

  const prefix = klasifikasi.code // e.g. "1"
  const lastSub = klasifikasi.subKlasifikasiAkun[0]

  if (!lastSub) {
    // First sub: prefix + 0000001
    return prefix + "0000001"
  }

  // Increment: parse the numeric part after prefix
  const numPart = lastSub.code.slice(prefix.length)
  const nextNum = parseInt(numPart, 10) + 1
  return prefix + String(nextNum).padStart(7, "0")
}

export async function tambahSubKlasifikasiAkun(data: { name: string, klasifikasiAkunId: string, code?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const code = data.code || await generateSubKlasifikasiCode(data.klasifikasiAkunId)

  const result = await prisma.subKlasifikasiAkun.create({
    data: { code, name: data.name, klasifikasiAkunId: data.klasifikasiAkunId }
  })
  revalidatePath("/akun-keuangan")
  return result
}

export async function editSubKlasifikasiAkun(id: string, data: { code: string, name: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.subKlasifikasiAkun.update({ where: { id }, data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusSubKlasifikasiAkun(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.subKlasifikasiAkun.delete({ where: { id } })
  revalidatePath("/akun-keuangan")
}

// Auto-generate kode Akun Detail: subCode(8digit) + sequential 2 digit → 10 digit
export async function generateAkunDetailCode(subKlasifikasiAkunId: string): Promise<string> {
  const sub = await prisma.subKlasifikasiAkun.findUniqueOrThrow({
    where: { id: subKlasifikasiAkunId },
    include: { akunDetail: { orderBy: { code: "desc" } } }
  })

  const prefix = sub.code // e.g. "10000001"
  const lastAkun = sub.akunDetail[0]

  if (!lastAkun) {
    return prefix + "01"
  }

  const numPart = lastAkun.code.slice(prefix.length)
  const nextNum = parseInt(numPart, 10) + 1
  return prefix + String(nextNum).padStart(2, "0")
}

export async function tambahAkunDetail(data: { name: string, subKlasifikasiAkunId: string, code?: string, bankAccountNumber?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const code = data.code || await generateAkunDetailCode(data.subKlasifikasiAkunId)

  const result = await prisma.akunDetail.create({
    data: {
      code,
      name: data.name,
      subKlasifikasiAkunId: data.subKlasifikasiAkunId,
      bankAccountNumber: data.bankAccountNumber
    }
  })
  revalidatePath("/akun-keuangan")
  return result
}

export async function editAkunDetail(id: string, data: { code: string, name: string, bankAccountNumber?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.akunDetail.update({ where: { id }, data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusAkunDetail(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.akunDetail.delete({ where: { id } })
  revalidatePath("/akun-keuangan")
}

export async function toggleAkunDetail(id: string, isActive: boolean) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  const result = await prisma.akunDetail.update({ where: { id }, data: { isActive } })
  revalidatePath("/akun-keuangan")
  return result
}
