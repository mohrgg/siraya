"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"

export async function getKasMasuk(params?: {
  startDate?: Date,
  endDate?: Date,
  filterBy?: 'tanggal_transaksi' | 'tanggal_pembuatan',
  search?: string
}) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")
  const user = session.user as any

  const whereClause: any = {
    jenis: "KAS_MASUK",
  }

  // Role based filtering (unitSekolahId)
  if (user.role === "TATA_USAHA" && user.unitSekolahId) {
    whereClause.unitSekolahId = user.unitSekolahId
  }

  // Date filtering
  if (params?.startDate && params?.endDate) {
    const dateField = params.filterBy === 'tanggal_pembuatan' ? 'createdAt' : 'tanggal'
    whereClause[dateField] = {
      gte: params.startDate,
      lte: params.endDate
    }
  }

  // Search filtering
  if (params?.search) {
    whereClause.OR = [
      { noReferensi: { contains: params.search, mode: 'insensitive' } },
      { namaPihakKetiga: { contains: params.search, mode: 'insensitive' } },
      { deskripsi: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const transaksiList = await prisma.transaksi.findMany({
    where: whereClause,
    include: {
      pembuat: { select: { name: true } },
      detail: {
        include: {
          akun: { select: { kode: true, nama: true } }
        }
      }
    },
    orderBy: [
      { tanggal: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return transaksiList
}

export async function getKasBankAccounts() {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")
  const user = session.user as any

  const whereClause: any = {
    isKasBank: true,
    isActive: true,
    subKlasifikasi: {
      klasifikasi: {
        kode: "1" // Wajib dari kelompok Harta (Aset)
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

export async function getPendapatanAccounts() {
  // Returns all non-kas accounts (often Revenue / Income)
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")
  const user = session.user as any

  const whereClause: any = {
    isKasBank: false,
    isActive: true
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

export async function generateNoReferensi(tanggal: Date) {
  const yearMonth = format(tanggal, "yyMM")
  const prefix = `KM-${yearMonth}-`
  
  const lastTransaksi = await prisma.transaksi.findFirst({
    where: {
      noReferensi: {
        startsWith: prefix
      }
    },
    orderBy: {
      noReferensi: 'desc'
    }
  })

  if (!lastTransaksi) {
    return `${prefix}0001`
  }

  const lastNumber = parseInt(lastTransaksi.noReferensi.split('-')[2] || "0")
  const nextNumber = lastNumber + 1
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export type KasMasukPayload = {
  akunPenerimaId: string // DEBIT
  tanggal: Date
  noReferensi: string
  noFormulir?: string
  namaPihakKetiga?: string
  deskripsi: string
  sumber?: string
  details: { // KREDIT lines
    akunId: string
    nilai: number
    deskripsi?: string
  }[]
}

export async function createKasMasuk(data: KasMasukPayload) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")
  const user = session.user as any
  
  if (!data.details || data.details.length === 0) {
    throw new Error("Harus ada minimal satu baris pembukuan")
  }

  const totalNilai = data.details.reduce((sum, item) => sum + item.nilai, 0)
  
  // Start a transaction for Double Entry Bookkeeping
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the Header Transaksi
    const transaksi = await tx.transaksi.create({
      data: {
        noReferensi: data.noReferensi,
        noFormulir: data.noFormulir,
        tanggal: data.tanggal,
        jenis: "KAS_MASUK",
        sumber: data.sumber || "MANUAL",
        deskripsi: data.deskripsi,
        totalNilai: totalNilai,
        status: "POSTED",
        namaPihakKetiga: data.namaPihakKetiga,
        unitSekolahId: user.unitSekolahId,
        pembuatId: user.id,
      }
    })

    // 2. Create the DEBIT line (Uang Masuk ke Kas/Bank yang dipilih)
    await tx.transaksiDetail.create({
      data: {
        transaksiId: transaksi.id,
        akunId: data.akunPenerimaId,
        posisi: "DEBIT",
        nilai: totalNilai,
        deskripsi: "Penerimaan Kas: " + data.deskripsi
      }
    })

    // 3. Create the KREDIT lines (Sumber Uang)
    for (const detail of data.details) {
      await tx.transaksiDetail.create({
        data: {
          transaksiId: transaksi.id,
          akunId: detail.akunId,
          posisi: "KREDIT",
          nilai: detail.nilai,
          deskripsi: detail.deskripsi || data.deskripsi
        }
      })
    }
    
    return transaksi
  })
  
  // Log Aktivitas
  await prisma.logAktivitas.create({
    data: {
      penggunaId: user.id,
      aksi: "CREATE",
      modul: "KAS_MASUK",
      keterangan: `Membuat penerimaan kas masuk (No Ref: ${data.noReferensi}) sebesar Rp ${totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  return result
}

export async function hapusKasMasuk(id: string) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Hanya admin yang dapat menghapus transaksi yang sudah diposting")
  }
  const user = session.user as any

  const tx = await prisma.transaksi.findUnique({ where: { id } })
  if (!tx) throw new Error("Transaksi tidak ditemukan")

  await prisma.transaksi.delete({ where: { id } })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: user.id,
      aksi: "DELETE",
      modul: "KAS_MASUK",
      keterangan: `Menghapus penerimaan kas masuk (No Ref: ${tx.noReferensi}) sebesar Rp ${tx.totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  return true
}

export async function getKasMasukById(id: string) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")

  const tx = await prisma.transaksi.findUnique({
    where: { id },
    include: {
      pembuat: { select: { name: true } },
      detail: {
        include: {
          akun: {
            select: { kode: true, nama: true }
          }
        }
      }
    }
  })

  if (!tx) throw new Error("Transaksi tidak ditemukan")
  return tx
}

export async function updateKasMasuk(id: string, data: KasMasukPayload) {
  const session = await auth()
  if (!session || !session.user) throw new Error("Unauthorized")
  const user = session.user as any
  
  if (!data.details || data.details.length === 0) {
    throw new Error("Harus ada minimal satu baris pembukuan")
  }

  const existingTx = await prisma.transaksi.findUnique({
    where: { id },
    include: { detail: true }
  })

  if (!existingTx) throw new Error("Transaksi tidak ditemukan")

  const totalNilai = data.details.reduce((sum, item) => sum + item.nilai, 0)
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the Header Transaksi
    const updatedTransaksi = await tx.transaksi.update({
      where: { id },
      data: {
        tanggal: data.tanggal,
        deskripsi: data.deskripsi,
        totalNilai: totalNilai,
        namaPihakKetiga: data.namaPihakKetiga,
        noFormulir: data.noFormulir,
        isEdited: true,
        editReason: "Diedit melalui halaman Ubah Kas Masuk"
      }
    })

    // 2. Delete existing details
    await tx.transaksiDetail.deleteMany({
      where: { transaksiId: id }
    })

    // 3. Create the DEBIT line (Uang Masuk ke Kas/Bank yang dipilih)
    await tx.transaksiDetail.create({
      data: {
        transaksiId: id,
        akunId: data.akunPenerimaId,
        posisi: "DEBIT",
        nilai: totalNilai,
        deskripsi: "Penerimaan Kas: " + data.deskripsi
      }
    })

    // 4. Create the KREDIT lines (Sumber Uang)
    for (const detail of data.details) {
      await tx.transaksiDetail.create({
        data: {
          transaksiId: id,
          akunId: detail.akunId,
          posisi: "KREDIT",
          nilai: detail.nilai,
          deskripsi: detail.deskripsi || data.deskripsi
        }
      })
    }
    
    return updatedTransaksi
  })
  
  // Log Aktivitas
  await prisma.logAktivitas.create({
    data: {
      penggunaId: user.id,
      aksi: "UPDATE",
      modul: "KAS_MASUK",
      keterangan: `Mengubah penerimaan kas masuk (No Ref: ${existingTx.noReferensi}) menjadi Rp ${totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  revalidatePath(`/kas-masuk/${id}`)
  return result
}
