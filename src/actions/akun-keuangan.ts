"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

// ==========================================
// 1. KLASIFIKASI AKUN (Level 1)
// ==========================================
export async function getKlasifikasiAkun() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.klasifikasiAkun.findMany({
    orderBy: { kode: "asc" }
  })
}

// ==========================================
// 2. SUB KLASIFIKASI AKUN (Level 2)
// ==========================================
export async function getSubKlasifikasiAkun() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.subKlasifikasiAkun.findMany({
    include: {
      klasifikasi: true,
      _count: {
        select: { akunDetail: true }
      }
    },
    orderBy: { kode: "asc" }
  })
}

export async function tambahSubKlasifikasi(data: { kode: string, nama: string, klasifikasiAkunId: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Admin Yayasan yang dapat mengubah struktur klasifikasi.")

  // Check if kode is unique
  const existing = await prisma.subKlasifikasiAkun.findUnique({ where: { kode: data.kode } })
  if (existing) throw new Error("Kode subklasifikasi sudah digunakan.")

  const result = await prisma.subKlasifikasiAkun.create({ data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function editSubKlasifikasi(id: string, data: { kode?: string, nama?: string, klasifikasiAkunId?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Admin Yayasan yang dapat mengubah struktur klasifikasi.")

  if (data.kode) {
    const existing = await prisma.subKlasifikasiAkun.findFirst({ where: { kode: data.kode, id: { not: id } } })
    if (existing) throw new Error("Kode subklasifikasi sudah digunakan.")
  }

  const result = await prisma.subKlasifikasiAkun.update({
    where: { id },
    data
  })
  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusSubKlasifikasi(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Admin Yayasan yang dapat mengubah struktur klasifikasi.")

  // Prisma akan throw error jika ada relasi (karena onDelete: Restrict)
  try {
    const result = await prisma.subKlasifikasiAkun.delete({
      where: { id }
    })
    revalidatePath("/akun-keuangan")
    return result
  } catch (error: any) {
    if (error.code === 'P2003') throw new Error("Tidak dapat menghapus subklasifikasi karena masih memiliki akun detail.")
    throw error
  }
}

// ==========================================
// 3. AKUN DETAIL (Level 3)
// ==========================================
export async function getAkunDetail() {
  const tenant = await getTenantContext()

  const where = tenant.isGlobal
    ? {}
    : {
        OR: [
          { unitSekolahId: tenant.unitId },
          { unitSekolahId: null }
        ]
      }

  return prisma.akunDetail.findMany({
    where,
    include: {
      subKlasifikasi: {
        include: {
          klasifikasi: true
        }
      },
      unitSekolah: true
    },
    orderBy: { kode: "asc" }
  })
}

export async function tambahAkunDetail(data: { kode: string, nama: string, subKlasifikasiAkunId: string, unitSekolahId?: string | null, isKasBank: boolean, isActive: boolean }) {
  const tenant = await getTenantContext()
  if (!["ADMIN", "TATA_USAHA"].includes(tenant.role)) throw new Error("Akses ditolak.")

  if (tenant.role !== "ADMIN") {
    // Paksa kunci ke unit milik TATA_USAHA
    data.unitSekolahId = tenant.unitId
  }

  const existing = await prisma.akunDetail.findUnique({ where: { kode: data.kode } })
  if (existing) throw new Error("Kode akun sudah digunakan.")

  const result = await prisma.akunDetail.create({ data })
  revalidatePath("/akun-keuangan")
  return result
}

export async function editAkunDetail(id: string, data: { kode?: string, nama?: string, subKlasifikasiAkunId?: string, unitSekolahId?: string | null, isKasBank?: boolean, isActive?: boolean }) {
  const tenant = await getTenantContext()
  if (!["ADMIN", "TATA_USAHA"].includes(tenant.role)) throw new Error("Akses ditolak.")

  const current = await prisma.akunDetail.findUnique({ where: { id } })
  if (!current) throw new Error("Akun tidak ditemukan")

  if (tenant.role !== "ADMIN") {
    // Pastikan dia tidak mengedit akun milik unit lain
    if (current.unitSekolahId !== tenant.unitId) {
      throw new Error("Anda hanya dapat mengedit akun milik unit Anda sendiri.")
    }
    // Paksa unit data yang akan diupdate ke unit miliknya
    data.unitSekolahId = tenant.unitId
  }

  if (data.kode) {
    const existing = await prisma.akunDetail.findFirst({ where: { kode: data.kode, id: { not: id } } })
    if (existing) throw new Error("Kode akun sudah digunakan.")
  }

  const result = await prisma.akunDetail.update({
    where: { id },
    data
  })
  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusAkunDetail(id: string) {
  const tenant = await getTenantContext()
  if (!["ADMIN", "TATA_USAHA"].includes(tenant.role)) throw new Error("Akses ditolak.")

  const current = await prisma.akunDetail.findUnique({ where: { id } })
  if (!current) throw new Error("Akun tidak ditemukan")

  if (tenant.role === "TATA_USAHA" && current.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda hanya dapat menghapus akun milik unit Anda sendiri.")
  }

  const result = await prisma.akunDetail.delete({
    where: { id }
  })
  revalidatePath("/akun-keuangan")
  return result
}
