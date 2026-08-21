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
  
  // Jika Non-Admin login, lock ke unitnya
  if (user.role !== "ADMIN" && user.unitSekolahId) {
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

  if (user.role !== "ADMIN" && user.unitSekolahId) {
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
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const { tahunAkademikId, akunId, subKelasId, jumlah } = data

  // 1. Cari semua murid di subkelas ini
  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { subKelasId, tahunAkademikId },
    select: { muridId: true }
  })

  if (riwayatKelas.length === 0) {
    throw new Error("Tidak ada siswa di kelas ini pada tahun akademik tersebut")
  }

  // 2. Buat tagihan dengan mengecek kondisi eksisting agar sisa tagihan valid
  let successCount = 0
  
  await prisma.$transaction(async (tx) => {
    for (const rk of riwayatKelas) {
      const existing = await tx.tagihan.findUnique({
        where: {
          muridId_akunId_tahunAkademikId: {
            muridId: rk.muridId,
            akunId: akunId,
            tahunAkademikId: tahunAkademikId
          }
        }
      })

      if (existing) {
        const totalTelahDibayar = existing.jumlah - existing.sisaTagihan
        const sisaTagihanBaru = Math.max(0, jumlah - totalTelahDibayar)
        const statusBaru = sisaTagihanBaru <= 0 ? "LUNAS" : (sisaTagihanBaru < jumlah ? "SEBAGIAN" : "BELUM_LUNAS")

        await tx.tagihan.update({
          where: { id: existing.id },
          data: {
            jumlah: jumlah,
            sisaTagihan: sisaTagihanBaru,
            status: statusBaru
          }
        })
      } else {
        await tx.tagihan.create({
          data: {
            muridId: rk.muridId,
            akunId: akunId,
            tahunAkademikId: tahunAkademikId,
            jumlah: jumlah,
            sisaTagihan: jumlah,
            status: jumlah > 0 ? "BELUM_LUNAS" : "LUNAS"
          }
        })
      }
      successCount++
    }
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: (session.user as any).id,
      aksi: "CREATE",
      modul: "PEMBUATAN_TAGIHAN",
      keterangan: `Generate tagihan massal untuk ${successCount} siswa (Subkelas: ${subKelasId}, Nominal: Rp${jumlah})`
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
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  await prisma.$transaction(async (tx) => {
    for (const update of tagihanUpdates) {
      const existing = await tx.tagihan.findUnique({
        where: {
          muridId_akunId_tahunAkademikId: {
            muridId: muridId,
            akunId: update.akunId,
            tahunAkademikId: tahunAkademikId
          }
        }
      })

      if (existing) {
        const totalTelahDibayar = existing.jumlah - existing.sisaTagihan
        const sisaTagihanBaru = Math.max(0, update.jumlah - totalTelahDibayar)
        const statusBaru = sisaTagihanBaru <= 0 ? "LUNAS" : (sisaTagihanBaru < update.jumlah ? "SEBAGIAN" : "BELUM_LUNAS")

        await tx.tagihan.update({
          where: { id: existing.id },
          data: {
            jumlah: update.jumlah,
            sisaTagihan: sisaTagihanBaru,
            status: statusBaru
          }
        })
      } else {
        await tx.tagihan.create({
          data: {
            muridId: muridId,
            akunId: update.akunId,
            tahunAkademikId: tahunAkademikId,
            jumlah: update.jumlah,
            sisaTagihan: update.jumlah,
            status: update.jumlah > 0 ? "BELUM_LUNAS" : "LUNAS"
          }
        })
      }
    }
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: (session.user as any).id,
      aksi: "UPDATE",
      modul: "PEMBUATAN_TAGIHAN",
      keterangan: `Memperbarui tagihan individu siswa (Murid ID: ${muridId})`
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
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

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

    await prisma.logAktivitas.create({
      data: {
        penggunaId: (session.user as any).id,
        aksi: "DELETE",
        modul: "PEMBUATAN_TAGIHAN",
        keterangan: `Menghapus massal tagihan (Akun ID: ${akunId}) untuk Subkelas ${subKelasId}`
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
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

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
        status: "BELUM_LUNAS" // Hanya ubah yang belum pernah dibayar
      },
      data: {
        jumlah: jumlah,
        sisaTagihan: jumlah
      }
    })

    await prisma.logAktivitas.create({
      data: {
        penggunaId: (session.user as any).id,
        aksi: "UPDATE",
        modul: "PEMBUATAN_TAGIHAN",
        keterangan: `Mengubah nominal tagihan massal (Akun ID: ${akunId}) menjadi Rp${jumlah} untuk Subkelas ${subKelasId}`
      }
    })
  }

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: "Nominal tagihan massal berhasil diubah" }
}
