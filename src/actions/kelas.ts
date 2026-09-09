"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { logAktivitas } from "@/lib/logger"

// --- GRADES ---
export async function getTingkatan(unitSekolahId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.tingkat.findMany({
    where: {
      isDeleted: false,
      ...(session.user.role !== "ADMIN" && session.user.unitSekolahId ? { unitSekolahId: session.user.unitSekolahId } : (unitSekolahId && unitSekolahId !== "all" ? { unitSekolahId } : {}))
    },
    include: { unitSekolah: true },
    orderBy: { order: "asc" }
  })
}

export async function tambahTingkatan(data: { name: string, order: number, unitSekolahId: string }) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.tingkat.create({ 
    data: { name: data.name, order: data.order, unitSekolahId: data.unitSekolahId } 
  })

  await logAktivitas("TAMBAH_TINGKATAN", "AKADEMIK_KELAS", `Menambahkan tingkatan: ${result.name} (Urutan: ${result.order})`)

  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function editTingkatan(id: string, data: { name: string, order: number, unitSekolahId: string }) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const result = await prisma.tingkat.update({ 
    where: { id },
    data: { name: data.name, order: data.order, unitSekolahId: data.unitSekolahId } 
  })

  await logAktivitas("EDIT_TINGKATAN", "AKADEMIK_KELAS", `Mengubah tingkatan: ${result.name} (Urutan: ${result.order})`)

  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

// --- MAJORS ---
export async function getJurusan(unitSekolahId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.jurusan.findMany({
    where: { 
      isDeleted: false,
      ...(session.user.role !== "ADMIN" && session.user.unitSekolahId ? { unitSekolahId: session.user.unitSekolahId } : (unitSekolahId && unitSekolahId !== "all" ? { unitSekolahId } : {}))
    },
    include: { 
      unitSekolah: true,
      _count: {
        select: {
          subKelas: { where: { isDeleted: false } }
        }
      }
    },
    orderBy: [
      { unitSekolah: { name: "asc" } },
      { name: "asc" }
    ]
  })
}

export async function tambahJurusan(data: { name: string, code: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const existing = await prisma.jurusan.findFirst({
    where: {
      code: data.code,
      unitSekolahId: data.unitSekolahId
    }
  })

  if (existing) {
    if (existing.isDeleted) {
      const result = await prisma.jurusan.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          isDeleted: false
        },
        include: {
          unitSekolah: true,
          _count: {
            select: { subKelas: { where: { isDeleted: false } } }
          }
        }
      })
      revalidatePath("/(dashboard)/(data-yayasan)/jurusan", "page")
      revalidatePath("/data-master")
      return result
    } else {
      throw new Error(`Kode jurusan '${data.code}' sudah terdaftar dan aktif pada unit sekolah ini.`)
    }
  }

  const result = await prisma.jurusan.create({ 
    data,
    include: {
      unitSekolah: true,
      _count: {
        select: { subKelas: { where: { isDeleted: false } } }
      }
    }
  })

  await logAktivitas("TAMBAH_JURUSAN", "AKADEMIK_JURUSAN", `Menambahkan jurusan: ${result.name} (${result.code})`)

  revalidatePath("/(dashboard)/(data-yayasan)/jurusan", "page")
  revalidatePath("/data-master")
  return result
}

// --- CLASSROOMS ---
export async function getKelas(unitSekolahId?: string, tahunAkademikId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  return prisma.subKelas.findMany({
    where: {
      isDeleted: false,
      ...(session.user.role !== "ADMIN" && session.user.unitSekolahId ? { unitSekolahId: session.user.unitSekolahId } : (unitSekolahId && unitSekolahId !== "all" ? { unitSekolahId } : {})),
      ...(tahunAkademikId ? { tahunAkademikId } : {})
    },
    include: {
      unitSekolah: true,
      tingkat: true,
      jurusan: true,
      tahunAkademik: true,
      waliKelasGuru: true,
      _count: {
        select: { 
          riwayatKelas: {
            where: { isCurrent: true, murid: { status: "AKTIF" } }
          } 
        }
      }
    },
    orderBy: [
      { tingkat: { order: "asc" } },
      { name: "asc" }
    ]
  })
}

export async function tambahKelas(data: { 
  name: string
  tingkatId: string
  jurusanId?: string
  tahunAkademikId: string
  unitSekolahId: string
  waliKelasGuruId?: string
  waliKelas?: string
  waliKelasPhone?: string 
}) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const cleanData: any = { 
    name: data.name, 
    tingkatId: data.tingkatId, 
    jurusanId: data.jurusanId || null, 
    tahunAkademikId: data.tahunAkademikId, 
    unitSekolahId: data.unitSekolahId,
    waliKelasGuruId: data.waliKelasGuruId || null,
    waliKelas: data.waliKelas || null,
    waliKelasPhone: data.waliKelasPhone || null
  }

  const result = await prisma.subKelas.create({ 
    data: cleanData,
    include: {
      unitSekolah: true,
      tingkat: true,
      jurusan: true,
      tahunAkademik: true,
      waliKelasGuru: true
    }
  })

  const waliInfo = result.waliKelas ? ` - Wali Kelas: ${result.waliKelas}` : ""
  await logAktivitas("TAMBAH_KELAS", "AKADEMIK_KELAS", `Menambahkan rombel: ${(result as any).tingkat?.name || ""} ${result.name} (${(result as any).unitSekolah?.name || "-"})${waliInfo}`)

  revalidatePath("/data-master")
  revalidatePath("/kelas")
  return result
}

export async function hapusTingkatan(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")
  const result = await prisma.tingkat.update({ where: { id }, data: { isDeleted: true } })

  await logAktivitas("HAPUS_TINGKATAN", "AKADEMIK_KELAS", `Menghapus tingkatan: ${result.name} (ID: ${id})`)

  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function editJurusan(id: string, data: { name: string, code: string, unitSekolahId: string }) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"].includes(session.user.role)) throw new Error("Akses ditolak.")

  const existing = await prisma.jurusan.findFirst({
    where: {
      code: data.code,
      unitSekolahId: data.unitSekolahId,
      id: { not: id }
    }
  })

  if (existing) {
    if (existing.isDeleted) {
      await prisma.jurusan.delete({ where: { id: existing.id } }).catch(async () => {
        await prisma.jurusan.update({
          where: { id: existing.id },
          data: { code: `${existing.code}_del_${Date.now().toString().slice(-6)}` }
        })
      })
    } else {
      throw new Error(`Kode jurusan '${data.code}' sudah digunakan oleh jurusan lain pada unit sekolah ini.`)
    }
  }

  const result = await prisma.jurusan.update({ 
    where: { id }, 
    data,
    include: {
      unitSekolah: true,
      _count: {
        select: { subKelas: { where: { isDeleted: false } } }
      }
    }
  })

  await logAktivitas("EDIT_JURUSAN", "AKADEMIK_JURUSAN", `Mengubah jurusan: ${result.name} (${result.code})`)

  revalidatePath("/(dashboard)/(data-yayasan)/jurusan", "page")
  revalidatePath("/data-master")
  return result
}

export async function hapusJurusan(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"].includes(session.user.role)) throw new Error("Akses ditolak.")
  const existing = await prisma.jurusan.findUnique({ where: { id } })
  const result = await prisma.jurusan.update({ 
    where: { id }, 
    data: { 
      isDeleted: true,
      code: existing ? `${existing.code}_del_${Date.now().toString().slice(-6)}` : undefined
    } 
  })

  await logAktivitas("HAPUS_JURUSAN", "AKADEMIK_JURUSAN", `Menghapus jurusan: ${existing?.name || result.id}`)

  revalidatePath("/(dashboard)/(data-yayasan)/jurusan", "page")
  revalidatePath("/data-master")
  return result
}

export async function editKelas(id: string, data: { 
  name?: string
  tingkatId?: string
  jurusanId?: string
  tahunAkademikId?: string
  unitSekolahId?: string
  waliKelasGuruId?: string
  waliKelas?: string
  waliKelasPhone?: string 
}) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")
  const cleanData: any = { 
    ...data, 
    jurusanId: data.jurusanId === "" ? null : data.jurusanId,
    waliKelasGuruId: data.waliKelasGuruId === "" ? null : data.waliKelasGuruId,
    waliKelas: data.waliKelas === "" ? null : data.waliKelas,
    waliKelasPhone: data.waliKelasPhone === "" ? null : data.waliKelasPhone
  }
  const result = await prisma.subKelas.update({ 
    where: { id }, 
    data: cleanData,
    include: {
      unitSekolah: true,
      tingkat: true,
      jurusan: true,
      tahunAkademik: true,
      waliKelasGuru: true
    }
  })

  const waliInfo = result.waliKelas ? ` - Wali Kelas: ${result.waliKelas}` : ""
  await logAktivitas("EDIT_KELAS", "AKADEMIK_KELAS", `Mengubah rombel: ${(result as any).tingkat?.name || ""} ${result.name}${waliInfo}`)

  revalidatePath("/data-master")
  revalidatePath("/kelas")
  return result
}

export async function hapusKelas(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TATA_USAHA"].includes(session.user.role)) throw new Error("Akses ditolak.")
  const result = await prisma.subKelas.update({ where: { id }, data: { isDeleted: true } })

  await logAktivitas("HAPUS_KELAS", "AKADEMIK_KELAS", `Menghapus rombel kelas: ${result.name} (ID: ${id})`)

  revalidatePath("/data-master")
  return result
}
