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
  const where: any = { isDeleted: false }
  if (unitSekolahId && unitSekolahId !== "all") {
    where.unitSekolahId = unitSekolahId
  }
  const result = await prisma.tingkat.findMany({
    where,
    orderBy: { order: 'asc' }
  })
  console.log("getKelasByUnit called with", unitSekolahId, "Result length:", result.length)
  return result
}

export async function getSubKelasByKelas(tingkatId: string, jurusanId?: string, tahunAkademikId?: string) {
  const where: any = { tingkatId, isDeleted: false }
  
  // Jika jurusan diberikan, filter subkelas berdasarkan jurusan
  if (jurusanId) {
    where.jurusanId = jurusanId
  }

  // Filter berdasarkan tahun akademik jika diberikan
  if (tahunAkademikId) {
    where.tahunAkademikId = tahunAkademikId
  }

  return prisma.subKelas.findMany({
    where,
    orderBy: { name: 'asc' }
  })
}

export async function getJurusanByUnit(unitSekolahId: string) {
  const where: any = { isDeleted: false }
  if (unitSekolahId && unitSekolahId !== "all") {
    where.unitSekolahId = unitSekolahId
  }
  return prisma.jurusan.findMany({
    where,
    orderBy: { name: 'asc' }
  })
}

export async function getAkunPendapatan(activeUnitId?: string) {
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

  if (activeUnitId && activeUnitId !== "all") {
    whereClause.unitSekolahId = activeUnitId
  } else if (user.role !== "ADMIN" && user.unitSekolahId) {
    whereClause.unitSekolahId = user.unitSekolahId
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
  namaTagihan: string
  jumlah: number
  targetType: "tingkat" | "kelas" | "murid"
  tingkatId?: string
  subKelasId?: string
  muridIds?: string[]
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const { tahunAkademikId, akunId, namaTagihan, jumlah } = data

  // 1. Cari semua murid sesuai target
  let riwayatKelas: { muridId: string }[] = []

  if (data.targetType === "kelas" && data.subKelasId) {
    riwayatKelas = await prisma.riwayatKelas.findMany({
      where: { subKelasId: data.subKelasId, tahunAkademikId },
      select: { muridId: true }
    })
  } else if (data.targetType === "tingkat" && data.tingkatId) {
    riwayatKelas = await prisma.riwayatKelas.findMany({
      where: { 
        tahunAkademikId,
        subKelas: {
          tingkatId: data.tingkatId
        }
      },
      select: { muridId: true }
    })
  } else if (data.targetType === "murid" && data.muridIds) {
    riwayatKelas = data.muridIds.map(id => ({ muridId: id }))
  }

  if (riwayatKelas.length === 0) {
    throw new Error("Tidak ada siswa yang sesuai dengan target pada tahun akademik tersebut")
  }

  // 2. Buat tagihan dengan mengecek kondisi eksisting agar sisa tagihan valid
  let successCount = 0
  
  await prisma.$transaction(async (tx) => {
    for (const rk of riwayatKelas) {
      const existing = await tx.tagihan.findUnique({
        where: {
          muridId_akunId_tahunAkademikId_namaTagihan: {
            muridId: rk.muridId,
            akunId: akunId,
            tahunAkademikId: tahunAkademikId,
            namaTagihan: namaTagihan
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
            namaTagihan: namaTagihan,
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
      keterangan: `Generate tagihan massal untuk ${successCount} siswa (Target: ${data.targetType}, Nominal: Rp${jumlah})`
    }
  })

  revalidatePath("/pembuatan-tagihan")
  return { success: true, message: `Berhasil men-generate tagihan untuk ${successCount} siswa` }
}

/**
 * Memperbarui tagihan individu seorang siswa dari matriks grid
 */
export async function updateTagihanSiswa(muridId: string, tahunAkademikId: string, tagihanUpdates: { akunId: string, namaTagihan: string, jumlah: number }[]) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  await prisma.$transaction(async (tx) => {
    for (const update of tagihanUpdates) {
      const existing = await tx.tagihan.findUnique({
        where: {
          muridId_akunId_tahunAkademikId_namaTagihan: {
            muridId: muridId,
            akunId: update.akunId,
            tahunAkademikId: tahunAkademikId,
            namaTagihan: update.namaTagihan
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
            namaTagihan: update.namaTagihan,
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
export async function hapusTagihanMassal(subKelasId: string, tahunAkademikId: string, akunId: string, namaTagihan: string) {
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
        namaTagihan,
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
export async function editTagihanMassal(subKelasId: string, tahunAkademikId: string, akunId: string, namaTagihan: string, jumlah: number) {
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
        namaTagihan,
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

/**
 * Mendapatkan urutan kolom tagihan (Global per Unit Sekolah)
 */
export async function getColumnOrder(unitSekolahId: string): Promise<string[]> {
  try {
    const unit = await prisma.unitSekolah.findUnique({
      where: { id: unitSekolahId },
      select: { tagihanColumnOrder: true }
    })
    if (unit?.tagihanColumnOrder) {
      return JSON.parse(unit.tagihanColumnOrder) as string[]
    }
  } catch (e) {
    console.error("Failed to parse column order", e)
  }
  return []
}

/**
 * Menyimpan urutan kolom tagihan (Global per Unit Sekolah)
 */
export async function saveColumnOrder(unitSekolahId: string, order: string[]) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  await prisma.unitSekolah.update({
    where: { id: unitSekolahId },
    data: { tagihanColumnOrder: JSON.stringify(order) }
  })
  
  // revalidatePath("/pembuatan-tagihan")
  return { success: true }
}

/**
 * Mengedit metadata kolom tagihan secara massal (Nama, Akun, Nominal)
 */
export async function updateTagihanKolomMassal(
  subKelasId: string, 
  tahunAkademikId: string, 
  oldAkunId: string, 
  oldNamaTagihan: string, 
  newAkunId: string, 
  newNamaTagihan: string, 
  newJumlah: number
) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: { subKelasId, tahunAkademikId },
    select: { muridId: true }
  })
  const muridIds = riwayatKelas.map(rk => rk.muridId)
  if (muridIds.length === 0) return { success: true }

  // Cek apakah ada yang sudah dibayar
  const paidCount = await prisma.tagihan.count({
    where: {
      tahunAkademikId,
      akunId: oldAkunId,
      namaTagihan: oldNamaTagihan,
      muridId: { in: muridIds },
      status: { not: "BELUM_LUNAS" }
    }
  })

  if (paidCount > 0 && oldAkunId !== newAkunId) {
    throw new Error("Tidak dapat mengubah Akun Keuangan karena sudah ada siswa yang melakukan pembayaran pada tagihan ini. Anda hanya diizinkan mengubah Nama Tagihan dan Nominal.")
  }

  // Gunakan transaction agar konsisten
  await prisma.$transaction(async (tx) => {
    // 1. Update namaTagihan dan akunId untuk SEMUA tagihan (agar tidak split kolom)
    if (oldNamaTagihan !== newNamaTagihan || oldAkunId !== newAkunId) {
      // Kita harus berhati-hati dengan unique constraint: [muridId, akunId, tahunAkademikId, namaTagihan]
      // Jika kita updateMany ke nama yang sudah ada, bisa bentrok.
      // Solusi: Lakukan update bertahap per murid atau updateMany (Prisma akan error jika bentrok, yang mana itu bagus sebagai proteksi)
      await tx.tagihan.updateMany({
        where: {
          tahunAkademikId,
          akunId: oldAkunId,
          namaTagihan: oldNamaTagihan,
          muridId: { in: muridIds }
        },
        data: {
          namaTagihan: newNamaTagihan,
          akunId: newAkunId
        }
      })
    }

    // 2. Update jumlah hanya untuk yang belum dibayar sama sekali
    await tx.tagihan.updateMany({
      where: {
        tahunAkademikId,
        akunId: newAkunId,
        namaTagihan: newNamaTagihan,
        muridId: { in: muridIds },
        status: "BELUM_LUNAS"
      },
      data: {
        jumlah: newJumlah,
        sisaTagihan: newJumlah
      }
    })

    await tx.logAktivitas.create({
      data: {
        penggunaId: (session.user as any).id,
        aksi: "UPDATE",
        modul: "PEMBUATAN_TAGIHAN",
        keterangan: `Edit kolom tagihan massal dari [${oldNamaTagihan}] ke [${newNamaTagihan}] untuk Subkelas ${subKelasId}`
      }
    })
  })

  revalidatePath("/pembuatan-tagihan")
  return { success: true }
}
