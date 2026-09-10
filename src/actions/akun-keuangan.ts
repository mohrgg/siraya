"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

// ==========================================
// 1. KLASIFIKASI AKUN (Level 1)
// ==========================================
export async function getKlasifikasiAkun(unitId?: string) {
  const tenant = await getTenantContext()
  const filterUnitId = unitId || tenant.unitId
  const where = filterUnitId ? { unitSekolahId: filterUnitId } : {}

  const data = await prisma.klasifikasiAkun.findMany({
    where,
    orderBy: { kode: "asc" }
  })

  // Auto-seed if empty and we are filtering by a specific unit
  if (data.length === 0 && filterUnitId) {
    const defaultKlasifikasi = [
      { kode: '1', nama: 'HARTA (ASET)' },
      { kode: '2', nama: 'KEWAJIBAN (LIABILITAS)' },
      { kode: '3', nama: 'MODAL (EKUITAS)' },
      { kode: '4', nama: 'PENDAPATAN' },
      { kode: '5', nama: 'BEBAN (BIAYA)' },
    ];
    
    await prisma.klasifikasiAkun.createMany({
      data: defaultKlasifikasi.map(k => ({
        kode: k.kode,
        nama: k.nama,
        unitSekolahId: filterUnitId
      })),
      skipDuplicates: true
    })

    return prisma.klasifikasiAkun.findMany({
      where,
      orderBy: { kode: "asc" }
    })
  }

  return data
}

// ==========================================
// 2. SUB KLASIFIKASI AKUN (Level 2)
// ==========================================
export async function getSubKlasifikasiAkun(unitId?: string) {
  const tenant = await getTenantContext()
  const filterUnitId = unitId || tenant.unitId
  const where = filterUnitId ? { unitSekolahId: filterUnitId } : {}

  return prisma.subKlasifikasiAkun.findMany({
    where,
    include: {
      klasifikasi: true,
      _count: {
        select: { akunDetail: true }
      }
    },
    orderBy: { kode: "asc" }
  })
}

export async function tambahSubKlasifikasi(data: { kode: string, nama: string, klasifikasiAkunId: string, unitSekolahId?: string }) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const targetUnitId = data.unitSekolahId || tenant.unitId
  if (!targetUnitId) throw new Error("Unit sekolah harus dipilih.")

  const existing = await prisma.subKlasifikasiAkun.findUnique({ 
    where: { 
      kode_unitSekolahId: {
        kode: data.kode,
        unitSekolahId: targetUnitId
      }
    } 
  })
  if (existing) throw new Error("Kode subklasifikasi sudah digunakan di unit ini.")

  const result = await prisma.subKlasifikasiAkun.create({ 
    data: {
      kode: data.kode,
      nama: data.nama,
      klasifikasiAkunId: data.klasifikasiAkunId,
      unitSekolahId: targetUnitId
    } 
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: tenant.user.id,
      aksi: "CREATE",
      modul: "AKUN_KEUANGAN",
      keterangan: `Menambahkan Sub Klasifikasi baru: ${data.kode} - ${data.nama}`
    }
  })

  revalidatePath("/akun-keuangan")
  return result
}

export async function editSubKlasifikasi(id: string, data: { kode?: string, nama?: string, klasifikasiAkunId?: string }) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const current = await prisma.subKlasifikasiAkun.findUnique({ where: { id } })
  if (!current) throw new Error("Subklasifikasi tidak ditemukan.")

  if (tenant.role === "TATA_USAHA" && current.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda hanya dapat mengedit data unit Anda sendiri.")
  }

  if (data.kode) {
    const existing = await prisma.subKlasifikasiAkun.findFirst({ 
      where: { kode: data.kode, unitSekolahId: current.unitSekolahId, id: { not: id } } 
    })
    if (existing) throw new Error("Kode subklasifikasi sudah digunakan di unit ini.")
  }

  const result = await prisma.subKlasifikasiAkun.update({
    where: { id },
    data
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: tenant.user.id,
      aksi: "UPDATE",
      modul: "AKUN_KEUANGAN",
      keterangan: `Memperbarui Sub Klasifikasi: ${result.kode} - ${result.nama}`
    }
  })

  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusSubKlasifikasi(id: string) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const current = await prisma.subKlasifikasiAkun.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: { akunDetail: true }
      }
    }
  })
  if (!current) throw new Error("Subklasifikasi tidak ditemukan.")

  if (tenant.role === "TATA_USAHA" && current.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda hanya dapat menghapus data unit Anda sendiri.")
  }

  const akunCount = current._count?.akunDetail || 0
  if (akunCount > 0) {
    throw new Error(`Tidak dapat menghapus subklasifikasi '${current.kode} - ${current.nama}' karena masih memiliki ${akunCount} akun detail di bawahnya. Pindahkan atau hapus akun detail terkait terlebih dahulu.`)
  }

  try {
    const result = await prisma.subKlasifikasiAkun.delete({
      where: { id }
    })

    await prisma.logAktivitas.create({
      data: {
        penggunaId: tenant.user.id,
        aksi: "DELETE",
        modul: "AKUN_KEUANGAN",
        keterangan: `Menghapus Sub Klasifikasi: ${result.kode} - ${result.nama}`
      }
    })

    revalidatePath("/akun-keuangan")
    return result
  } catch (error: any) {
    if (error.code === 'P2003') throw new Error("Tidak dapat menghapus subklasifikasi karena masih memiliki data terkait.")
    throw error
  }
}

// ==========================================
// 3. AKUN DETAIL (Level 3)
// ==========================================
export async function getAkunDetail(unitId?: string) {
  const tenant = await getTenantContext()
  const filterUnitId = unitId || tenant.unitId
  const where = filterUnitId ? { unitSekolahId: filterUnitId } : {}

  return prisma.akunDetail.findMany({
    where,
    include: {
      subKlasifikasi: {
        include: {
          klasifikasi: true
        }
      },
      unitSekolah: true,
      _count: {
        select: {
          tagihan: true,
          transaksiDetail: true
        }
      }
    },
    orderBy: { kode: "asc" }
  })
}

export async function tambahAkunDetail(data: { kode: string, nama: string, subKlasifikasiAkunId: string, unitSekolahId?: string, isKasBank: boolean, isSPP?: boolean, isActive: boolean }) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const targetUnitId = data.unitSekolahId || tenant.unitId
  if (!targetUnitId) throw new Error("Unit sekolah harus dipilih.")

  const existing = await prisma.akunDetail.findUnique({ 
    where: { 
      kode_unitSekolahId: {
        kode: data.kode,
        unitSekolahId: targetUnitId
      }
    } 
  })
  if (existing) throw new Error("Kode akun sudah digunakan di unit ini.")

  const result = await prisma.akunDetail.create({ 
    data: {
      kode: data.kode,
      nama: data.nama,
      subKlasifikasiAkunId: data.subKlasifikasiAkunId,
      unitSekolahId: targetUnitId,
      isKasBank: data.isKasBank,
      isSPP: data.isSPP || false,
      isActive: data.isActive
    } 
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: tenant.user.id,
      aksi: "CREATE",
      modul: "AKUN_KEUANGAN",
      keterangan: `Menambahkan Akun Detail baru: ${data.kode} - ${data.nama}`
    }
  })

  revalidatePath("/akun-keuangan")
  return result
}

export async function editAkunDetail(id: string, data: { kode?: string, nama?: string, subKlasifikasiAkunId?: string, unitSekolahId?: string, isKasBank?: boolean, isSPP?: boolean, isActive?: boolean }) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const current = await prisma.akunDetail.findUnique({ where: { id } })
  if (!current) throw new Error("Akun tidak ditemukan")

  if (tenant.role === "TATA_USAHA" && current.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda hanya dapat mengedit akun milik unit Anda sendiri.")
  }

  const targetUnitId = current.unitSekolahId

  if (data.kode) {
    const existing = await prisma.akunDetail.findFirst({ 
      where: { kode: data.kode, unitSekolahId: targetUnitId, id: { not: id } } 
    })
    if (existing) throw new Error("Kode akun sudah digunakan di unit ini.")
  }

  const result = await prisma.akunDetail.update({
    where: { id },
    data: {
      kode: data.kode,
      nama: data.nama,
      subKlasifikasiAkunId: data.subKlasifikasiAkunId,
      isKasBank: data.isKasBank,
      isSPP: data.isSPP !== undefined ? data.isSPP : current.isSPP,
      isActive: data.isActive
    }
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: tenant.user.id,
      aksi: "UPDATE",
      modul: "AKUN_KEUANGAN",
      keterangan: `Memperbarui Akun Detail: ${result.kode} - ${result.nama}`
    }
  })

  revalidatePath("/akun-keuangan")
  return result
}

export async function hapusAkunDetail(id: string) {
  const tenant = await getTenantContext()
  if (tenant.role === "KEPALA_SEKOLAH" || tenant.role === "YAYASAN") throw new Error("Akses ditolak (Read-Only).")

  const current = await prisma.akunDetail.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: {
          tagihan: true,
          transaksiDetail: true
        }
      }
    }
  })
  if (!current) throw new Error("Akun tidak ditemukan")

  if (tenant.role === "TATA_USAHA" && current.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda hanya dapat menghapus akun milik unit Anda sendiri.")
  }

  const countTagihan = current._count?.tagihan || 0
  const countTransaksi = current._count?.transaksiDetail || 0

  if (countTagihan > 0 || countTransaksi > 0) {
    const detailList = []
    if (countTagihan > 0) detailList.push(`${countTagihan} tagihan`)
    if (countTransaksi > 0) detailList.push(`${countTransaksi} transaksi keuangan`)
    throw new Error(
      `Akun '${current.kode} - ${current.nama}' tidak dapat dihapus karena masih digunakan oleh ${detailList.join(" dan ")}. Sebagai alternatif, silakan nonaktifkan akun ini.`
    )
  }

  try {
    const result = await prisma.akunDetail.delete({
      where: { id }
    })

    await prisma.logAktivitas.create({
      data: {
        penggunaId: tenant.user.id,
        aksi: "DELETE",
        modul: "AKUN_KEUANGAN",
        keterangan: `Menghapus Akun Detail: ${result.kode} - ${result.nama}`
      }
    })

    revalidatePath("/akun-keuangan")
    return result
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error(`Tidak dapat menghapus akun '${current.kode} - ${current.nama}' karena masih memiliki data tagihan atau transaksi terkait.`)
    }
    throw error
  }
}
