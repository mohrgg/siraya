"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function getGuruList(unitSekolahId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: any = { isDeleted: false, isActive: true }
  if (unitSekolahId) {
    where.unitSekolahId = unitSekolahId
  }

  return prisma.guru.findMany({
    where,
    orderBy: { name: "asc" },
    include: { unitSekolah: true }
  })
}

export async function getGuruPaginated({
  unitSekolahId,
  search = "",
  statusFilter = "",
  page = 1,
  limit = 20
}: {
  unitSekolahId?: string
  search?: string
  statusFilter?: string
  page?: number
  limit?: number
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: any = { isDeleted: false }
  if (unitSekolahId) {
    where.unitSekolahId = unitSekolahId
  }
  if (statusFilter) {
    where.statusKepegawaian = statusFilter
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { nip: { contains: search, mode: "insensitive" } },
      { bidangStudi: { contains: search, mode: "insensitive" } }
    ]
  }

  const [total, data] = await Promise.all([
    prisma.guru.count({ where }),
    prisma.guru.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        unitSekolah: true,
        rombelWali: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        }
      }
    })
  ])

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

export async function tambahGuru(data: {
  name: string
  nip?: string
  gender: string
  phone?: string
  email?: string
  statusKepegawaian?: string
  pendidikan?: string
  bidangStudi?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  unitSekolahId: string
}) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) {
    throw new Error("Akses ditolak.")
  }

  const { id, unitSekolah, rombelWali, createdAt, updatedAt, ...guruData } = data as any;
  const result = await prisma.guru.create({
    data: {
      ...guruData,
      nip: guruData.nip || null,
      phone: guruData.phone || null,
      email: guruData.email || null,
      pendidikan: guruData.pendidikan || null,
      bidangStudi: guruData.bidangStudi || null,
      bankName: guruData.bankName || null,
      bankAccount: guruData.bankAccount || null,
      bankAccountName: guruData.bankAccountName || null
    }
  })

  revalidatePath("/guru")
  revalidatePath("/kelas")
  return result
}

export async function editGuru(id: string, data: {
  name?: string
  nip?: string
  gender?: string
  phone?: string
  email?: string
  statusKepegawaian?: string
  pendidikan?: string
  bidangStudi?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  unitSekolahId?: string
  isActive?: boolean
}) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) {
    throw new Error("Akses ditolak.")
  }

  const { id: _, unitSekolah, rombelWali, createdAt, updatedAt, ...guruData } = data as any;
  const result = await prisma.guru.update({
    where: { id },
    data: {
      ...guruData,
      nip: guruData.nip === "" ? null : guruData.nip,
      phone: guruData.phone === "" ? null : guruData.phone,
      email: guruData.email === "" ? null : guruData.email,
      pendidikan: guruData.pendidikan === "" ? null : guruData.pendidikan,
      bidangStudi: guruData.bidangStudi === "" ? null : guruData.bidangStudi,
      bankName: guruData.bankName === "" ? null : guruData.bankName,
      bankAccount: guruData.bankAccount === "" ? null : guruData.bankAccount,
      bankAccountName: guruData.bankAccountName === "" ? null : guruData.bankAccountName
    }
  })

  // Jika guru ini menjadi wali kelas di rombel, update juga snapshot string-nya
  if (data.name !== undefined || data.phone !== undefined) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.waliKelas = data.name
    if (data.phone !== undefined) updateData.waliKelasPhone = data.phone || null
    await prisma.subKelas.updateMany({
      where: { waliKelasGuruId: id },
      data: updateData
    })
  }

  revalidatePath("/guru")
  revalidatePath("/kelas")
  return result
}

export async function hapusGuru(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) {
    throw new Error("Akses ditolak.")
  }

  const result = await prisma.guru.update({
    where: { id },
    data: { isDeleted: true, isActive: false }
  })

  revalidatePath("/guru")
  revalidatePath("/kelas")
  return result
}
