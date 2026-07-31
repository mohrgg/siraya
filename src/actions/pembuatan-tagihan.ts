"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ==========================================
// MASTER DATA FETCHERS
// ==========================================

export async function getTahunAkademikAktif() {
  return prisma.tahunAkademik.findFirst({
    where: { isActive: true, isDeleted: false },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getTahunAkademikList() {
  return prisma.tahunAkademik.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'desc' }
  })
}

export async function getUnitSekolah() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const user = session.user as any

  const whereClause: any = { isActive: true }
  
  // Jika TU login, lock ke unitnya
  if (user.role === "TATA_USAHA" && user.unitSekolahId) {
    whereClause.id = user.unitSekolahId
  }

  return prisma.unitSekolah.findMany({
    where: whereClause,
    orderBy: { name: 'asc' }
  })
}

export async function getKelasByUnit(unitSekolahId: string) {
  return prisma.tingkat.findMany({
    where: { unitSekolahId, isDeleted: false },
    orderBy: { order: 'asc' }
  })
}

export async function getSubKelasByKelas(tingkatId: string, jurusanId?: string) {
  const where: any = { tingkatId, isDeleted: false }
  
  // Jika jurusan diberikan, filter subkelas berdasarkan jurusan
  if (jurusanId) {
    where.jurusanId = jurusanId
  }

  return prisma.subKelas.findMany({
    where,
    orderBy: { name: 'asc' }
  })
}

export async function getJurusanByUnit(unitSekolahId: string) {
  return prisma.jurusan.findMany({
    where: { unitSekolahId, isDeleted: false },
    orderBy: { name: 'asc' }
  })
}

export async function getAkunPendapatan() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const user = session.user as any

  const whereClause: any = {
    isKasBank: false,
    isActive: true,
    subKlasifikasi: {
      klasifikasi: {
        kode: '4' // Pendapatan
      }
    }
  }

  if (user.role === "TATA_USAHA" && user.unitSekolahId) {
    whereClause.OR = [
      { unitSekolahId: null },
      { unitSekolahId: user.unitSekolahId }
    ]
  }

  return prisma.akunDetail.findMany({
    where: whereClause,
    include: {
      subKlasifikasi: {
        include: { klasifikasi: true }
      }
    },
    orderBy: { kode: 'asc' }
  })
}

// ==========================================
// CORE TRANSACTIONS
// ==========================================

/**
 * Mendapatkan daftar murid di subkelas beserta semua tagihannya di tahun akademik tertentu.
 */
export async function getMuridWithTagihan(subKelasId: string, tahunAkademikId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 1. Ambil daftar murid yang tergabung di riwayat kelas ini
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: {
      subKelasId,
      tahunAkademikId
    },
    include: {
      murid: {
        include: {
          tagihan: {
            where: {
              tahunAkademikId
            },
            include: {
              akun: true
            }
          }
        }
      }
    },
    orderBy: {
      murid: { name: 'asc' }
    }
  })

  // 2. Ekstrak data murid dan tagihannya
  const muridList = riwayatKelas.map(rk => rk.murid).filter(m => !m.isDeleted && m.isActive)

  return muridList
}

/**
 * Menambahkan komponen tagihan baru secara massal ke seluruh murid di subkelas
 */
export async function tambahTagihanMassal(data: {
  tahunAkademikId: string
  akunId: string
  subKelasId: string
  jumlah: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { tahunAkademikId, akunId, subKelasId, jumlah } = data

  // 1. Cari semua murid di subkelas ini
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { subKelasId, tahunAkademikId },
    select: { muridId: true }
  })

  if (riwayatKelas.length === 0) {
    throw new Error("Tidak ada siswa di kelas ini pada tahun akademik tersebut")
  }

  // 2. Buat tagihan menggunakan upsert agar tidak duplicate
  let successCount = 0
  
  await prisma.$transaction(async (tx) => {
    for (const rk of riwayatKelas) {
      await tx.tagihan.upsert({
        where: {
          muridId_akunId_tahunAkademikId: {
            muridId: rk.muridId,
            akunId: akunId,
            tahunAkademikId: tahunAkademikId
          }
        },
        update: {
          jumlah: jumlah,
        },
        create: {
          muridId: rk.muridId,
          akunId: akunId,
          tahunAkademikId: tahunAkademikId,
          jumlah: jumlah,
          sisaTagihan: jumlah, // Sisa tagihan awal = jumlah
          status: "BELUM_LUNAS"
        }
      })
      successCount++
    }
  })

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: `Berhasil men-generate tagihan untuk ${successCount} siswa` }
}

/**
 * Memperbarui tagihan individu seorang siswa dari matriks grid
 */
export async function updateTagihanSiswa(muridId: string, tahunAkademikId: string, tagihanUpdates: { akunId: string, jumlah: number }[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.$transaction(async (tx) => {
    for (const update of tagihanUpdates) {
      await tx.tagihan.upsert({
        where: {
          muridId_akunId_tahunAkademikId: {
            muridId: muridId,
            akunId: update.akunId,
            tahunAkademikId: tahunAkademikId
          }
        },
        update: {
          jumlah: update.jumlah
        },
        create: {
          muridId: muridId,
          akunId: update.akunId,
          tahunAkademikId: tahunAkademikId,
          jumlah: update.jumlah,
          sisaTagihan: update.jumlah,
          status: update.jumlah > 0 ? "BELUM_LUNAS" : "LUNAS"
        }
      })
    }
  })

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: "Perubahan tagihan siswa berhasil disimpan" }
}

/**
 * Menghapus komponen tagihan (kolom) secara massal untuk satu subkelas
 */
export async function hapusTagihanMassal(subKelasId: string, tahunAkademikId: string, akunId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Ambil semua muridId di subkelas
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { subKelasId, tahunAkademikId },
    select: { muridId: true }
  })
  
  const muridIds = riwayatKelas.map(rk => rk.muridId)

  if (muridIds.length > 0) {
    await prisma.tagihan.deleteMany({
      where: {
        tahunAkademikId,
        akunId,
        muridId: { in: muridIds }
      }
    })
  }

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: "Tagihan massal berhasil dihapus" }
}

/**
 * Mengubah nominal tagihan secara massal untuk komponen tertentu di satu subkelas
 */
export async function editTagihanMassal(subKelasId: string, tahunAkademikId: string, akunId: string, jumlah: number) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Ambil semua muridId di subkelas
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { subKelasId, tahunAkademikId },
    select: { muridId: true }
  })
  
  const muridIds = riwayatKelas.map(rk => rk.muridId)

  if (muridIds.length > 0) {
    await prisma.tagihan.updateMany({
      where: {
        tahunAkademikId,
        akunId,
        muridId: { in: muridIds },
        // Jangan ubah yang sudah lunas atau dicicil (Opsional: di sini kita asumsikan update all untuk simplifikasi 
        // tapi sebaiknya status="BELUM_LUNAS" dan sisaTagihan=jumlah yang lama agar tidak merusak cicilan)
        // Karena sistem belum mencatat cicilan, kita update semua saja saat ini
      },
      data: {
        jumlah: jumlah,
        sisaTagihan: jumlah
      }
    })
  }

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: "Nominal tagihan massal berhasil diubah" }
}
