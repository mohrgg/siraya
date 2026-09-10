"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath, unstable_noStore } from "next/cache"

// ==========================================
// MASTER DATA FETCHERS
// ==========================================

export async function getTahunAkademikAktif() {
  unstable_noStore()
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
  unstable_noStore()
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
  unstable_noStore()
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
  unstable_noStore()
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
 * Mendapatkan daftar murid di subkelas beserta semua tagihannya di tahun akademik tertentu,
 * atau mencari murid langsung lintas kelas berdasarkan nama/NISN.
 */
export async function getMuridWithTagihan(
  subKelasIdOrOptions: string | { subKelasId?: string, searchName?: string, unitSekolahId?: string, tahunAkademikId: string }, 
  tahunAkademikIdParam?: string
) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  let subKelasId = typeof subKelasIdOrOptions === "string" ? subKelasIdOrOptions : subKelasIdOrOptions.subKelasId
  let tahunAkademikId = typeof subKelasIdOrOptions === "string" ? tahunAkademikIdParam! : subKelasIdOrOptions.tahunAkademikId
  let searchName = typeof subKelasIdOrOptions === "object" ? subKelasIdOrOptions.searchName : undefined
  let unitSekolahId = typeof subKelasIdOrOptions === "object" ? subKelasIdOrOptions.unitSekolahId : undefined

  if (searchName && searchName.trim()) {
    const q = searchName.trim()
    const whereMurid: any = {
      isDeleted: false,
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { nisn: { contains: q, mode: 'insensitive' } },
        { formNo: { contains: q, mode: 'insensitive' } }
      ]
    }
    if (unitSekolahId && unitSekolahId !== 'all') {
      whereMurid.unitSekolahId = unitSekolahId
    }
    if (subKelasId) {
      whereMurid.riwayatKelas = {
        some: { subKelasId }
      }
    }

    const muridList = await prisma.murid.findMany({
      where: whereMurid,
      include: {
        riwayatKelas: {
          orderBy: { createdAt: 'desc' },
          select: {
            subKelas: {
              select: { id: true, name: true }
            }
          },
          take: 1
        },
        tagihan: {
          where: { tahunAkademikId },
          include: { akun: true }
        },
        _count: {
          select: {
            tagihan: {
              where: {
                sisaTagihan: { gt: 0 },
                tahunAkademikId: { not: tahunAkademikId }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return muridList
  }

  // Mode Berdasarkan Subkelas
  if (!subKelasId) return []

  const riwayatKelas = await prisma.riwayatKelas.findMany({
    where: {
      subKelasId,
      tahunAkademikId
    },
    include: {
      subKelas: {
        select: { id: true, name: true }
      },
      murid: {
        include: {
          riwayatKelas: {
            where: { subKelasId, tahunAkademikId },
            select: {
              subKelas: {
                select: { id: true, name: true }
              }
            },
            take: 1
          },
          tagihan: {
            where: {
              tahunAkademikId
            },
            include: {
              akun: true
            }
          },
          _count: {
            select: {
              tagihan: {
                where: {
                  sisaTagihan: { gt: 0 },
                  tahunAkademikId: { not: tahunAkademikId }
                }
              }
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
  const seenIds = new Set<string>()
  const muridList = riwayatKelas
    .map(rk => {
      const m = rk.murid as any
      if (m && (!m.riwayatKelas || m.riwayatKelas.length === 0) && rk.subKelas) {
        m.riwayatKelas = [{ subKelas: rk.subKelas }]
      }
      return m
    })
    .filter(m => {
      if (!m || m.isDeleted || !m.isActive || seenIds.has(m.id)) return false
      seenIds.add(m.id)
      return true
    })

  return muridList
}

/**
 * Menambahkan komponen tagihan baru secara massal ke seluruh murid di subkelas
 */
export async function tambahTagihanMassal(data: {
  tahunAkademikId: string
  akunId: string
  namaTagihan?: string
  namaTagihans?: string[]
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

  const { tahunAkademikId, akunId, jumlah } = data
  const tagihanNames = data.namaTagihans || (data.namaTagihan ? [data.namaTagihan] : [])
  if (tagihanNames.length === 0) throw new Error("Nama tagihan tidak boleh kosong")

  // 1. Cari semua murid sesuai target
  let riwayatKelas: { muridId: string }[] = []

  if (data.targetType === "kelas" && data.subKelasId) {
    riwayatKelas = await prisma.riwayatKelas.findMany({
      where: { subKelasId: data.subKelasId, tahunAkademikId, isCurrent: true },
      select: { muridId: true }
    })
  } else if (data.targetType === "tingkat" && data.tingkatId) {
    riwayatKelas = await prisma.riwayatKelas.findMany({
      where: { 
        tahunAkademikId,
        isCurrent: true,
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

  // Cari unitSekolahId dari murid pertama
  const firstMurid = await prisma.murid.findUnique({
    where: { id: riwayatKelas[0].muridId },
    select: { unitSekolahId: true }
  })
  
  if (!firstMurid?.unitSekolahId) {
    throw new Error("Gagal mengidentifikasi Unit Sekolah dari target murid.")
  }
  const unitSekolahId = firstMurid.unitSekolahId

  // 2. Buat tagihan dengan mengecek kondisi eksisting agar sisa tagihan valid
  let successCount = 0
  
  await prisma.$transaction(async (tx) => {
    for (const rk of riwayatKelas) {
      for (const tName of tagihanNames) {
        const existing = await tx.tagihan.findUnique({
          where: {
            muridId_akunId_tahunAkademikId_namaTagihan: {
              muridId: rk.muridId,
              akunId: akunId,
              tahunAkademikId: tahunAkademikId,
              namaTagihan: tName
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
              namaTagihan: tName,
              jumlah: jumlah,
              sisaTagihan: jumlah,
              status: "BELUM_LUNAS"
            }
          })
        }
        successCount++
      }
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

  // 3. Tambahkan riwayat sinkronisasi tagihanColumnOrder untuk UnitSekolah
  const unitSekolah = await prisma.unitSekolah.findUnique({
    where: { id: unitSekolahId },
    select: { tagihanColumnOrder: true }
  })

  let currentOrder: string[] = []
  if (unitSekolah?.tagihanColumnOrder) {
    try {
      currentOrder = JSON.parse(unitSekolah.tagihanColumnOrder)
    } catch(e) {}
  }

  // Cari semua tagihan unik saat ini untuk merapikan urutan lama (jika ada yang bolong)
  const allTagihans = await prisma.tagihan.findMany({
    where: { 
      tahunAkademikId, 
      murid: { unitSekolahId }
    },
    include: { akun: true }
  })

  const uniqueCols = new Map<string, string>() // compId -> kode
  allTagihans.forEach(t => {
    const cid = `${t.akunId}::${t.namaTagihan}`
    if (!uniqueCols.has(cid)) {
      uniqueCols.set(cid, t.akun.kode)
    }
  })

  // Cari kolom yang sudah ada di database tapi belum masuk ke currentOrder
  const missingCols = Array.from(uniqueCols.keys()).filter(cid => !currentOrder.includes(cid))
  
  // Urutkan yang missing berdasarkan kode (alphabetical fallback)
  missingCols.sort((a, b) => uniqueCols.get(a)!.localeCompare(uniqueCols.get(b)!))
  
  // Masukkan yang missing ke akhir currentOrder
  currentOrder.push(...missingCols)

  // Terakhir, pastikan tagihan yang BARU DIBUAT diletakkan di Paling Kanan
  tagihanNames.forEach(tName => {
    const newCompId = `${akunId}::${tName}`
    currentOrder = currentOrder.filter(cid => cid !== newCompId)
    currentOrder.push(newCompId)
  })

  // Simpan ulang ke database
  await prisma.unitSekolah.update({
    where: { id: unitSekolahId },
    data: { tagihanColumnOrder: JSON.stringify(currentOrder) }
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
    const paidCount = await prisma.tagihan.count({
      where: {
        tahunAkademikId,
        akunId,
        namaTagihan,
        muridId: { in: muridIds },
        OR: [
          { status: "LUNAS" },
          { status: "SEBAGIAN" },
          { pembayaran: { some: {} } }
        ]
      }
    })

    if (paidCount > 0) {
      throw new Error(`Tidak dapat menghapus tagihan '${namaTagihan}' karena terdapat ${paidCount} siswa yang sudah melakukan pembayaran. Tagihan dengan riwayat pembayaran tidak boleh dihapus.`)
    }

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
