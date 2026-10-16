"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { format } from "date-fns"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant"

export async function getKasMasuk(params?: {
  startDate?: Date,
  endDate?: Date,
  filterBy?: 'tanggal_transaksi' | 'tanggal_pembuatan',
  search?: string
}) {
  const tenant = await getTenantContext()

  const whereClause: any = {
    jenis: "KAS_MASUK",
  }

  if (!tenant.isGlobal) {
    whereClause.unitSekolahId = tenant.unitId
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
          akun: { select: { id: true, kode: true, nama: true } }
        }
      },
      pembayaranTagihan: {
        include: {
          tagihan: {
            select: {
              namaTagihan: true,
              akunId: true,
              akun: {
                select: {
                  id: true,
                  kode: true,
                  nama: true,
                  isSPP: true
                }
              }
            }
          }
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

export async function getOpsiJenisPembayaran(unitSekolahId?: string) {
  const tenant = await getTenantContext()

  const whereClause: any = {
    subKlasifikasi: {
      klasifikasi: {
        kode: "4" // Klasifikasi Pendapatan
      }
    }
  }

  const targetUnitId = unitSekolahId !== undefined ? unitSekolahId : (!tenant.isGlobal ? tenant.unitId : undefined)
  if (targetUnitId) {
    whereClause.unitSekolahId = targetUnitId
  }

  const accounts = await prisma.akunDetail.findMany({
    where: whereClause,
    orderBy: { kode: "asc" },
    select: {
      id: true,
      kode: true,
      nama: true,
      isSPP: true,
      isActive: true
    }
  })

  // Deteksi kategori grup utama
  const hasSPP = accounts.some(a => a.isSPP || a.nama.toUpperCase().includes("SPP"))
  const hasBAT = accounts.some(a => a.nama.toUpperCase().includes("BAT"))
  const hasPSB = accounts.some(a => a.nama.toUpperCase().includes("PSB"))
  const hasDaftarUlang = accounts.some(a => a.nama.toUpperCase().includes("DAFTAR ULANG") || a.nama.toUpperCase().includes("DAFTAR_ULANG"))

  const options: { label: string, value: string }[] = [
    { label: "Semua Jenis Bayar", value: "ALL" }
  ]

  if (hasSPP) options.push({ label: "Semua SPP", value: "CAT:SPP" })
  if (hasBAT) options.push({ label: "Semua BAT", value: "CAT:BAT" })
  if (hasPSB) options.push({ label: "Semua PSB", value: "CAT:PSB" })
  if (hasDaftarUlang) options.push({ label: "Semua Daftar Ulang", value: "CAT:DAFTAR_ULANG" })

  // Tambahkan seluruh akun spesifik (termasuk akun baru masa depan)
  accounts.forEach(acc => {
    options.push({
      label: `${acc.kode} - ${acc.nama}${!acc.isActive ? ' (Nonaktif)' : ''}`,
      value: `AKUN:${acc.id}`
    })
  })

  return options
}

export async function getKasBankAccounts(unitSekolahId?: string) {
  const tenant = await getTenantContext()

  const whereClause: any = {
    isKasBank: true,
    isActive: true,
    subKlasifikasi: {
      klasifikasi: {
        kode: "1" // Wajib dari kelompok Harta (Aset)
      }
    }
  }

  const targetUnitId = unitSekolahId !== undefined ? unitSekolahId : (!tenant.isGlobal ? tenant.unitId : undefined)
  if (targetUnitId) {
    whereClause.unitSekolahId = targetUnitId
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

export async function getPendapatanAccounts(unitSekolahId?: string) {
  // Returns all non-kas accounts (often Revenue / Income)
  const tenant = await getTenantContext()

  const whereClause: any = {
    isKasBank: false,
    isActive: true,
    subKlasifikasi: {
      klasifikasi: {
        kode: '4'
      }
    }
  }

  const targetUnitId = unitSekolahId !== undefined ? unitSekolahId : (!tenant.isGlobal ? tenant.unitId : undefined)
  if (targetUnitId) {
    whereClause.unitSekolahId = targetUnitId
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
  unitSekolahId?: string
  details: { // KREDIT lines
    akunId: string
    nilai: number
    deskripsi?: string
  }[]
}

export async function createKasMasuk(data: KasMasukPayload) {
  const tenant = await getTenantContext()
  
  if (!data.details || data.details.length === 0) {
    throw new Error("Harus ada minimal satu baris pembukuan")
  }

  const totalNilai = data.details.reduce((sum, item) => sum + item.nilai, 0)
  
  let unitToSave = tenant.unitId
  if (tenant.role === "ADMIN") {
    if (data.unitSekolahId !== undefined) {
      unitToSave = data.unitSekolahId
    } else if (tenant.isGlobal) {
      unitToSave = null // Transaksi level yayasan
    }
  }

  // VALIDASI ISOLASI AKUN KEUANGAN (Prioritas 5)
  // Kumpulkan semua ID akun yang terlibat (Debit + Kredit)
  const allAccountIds = [data.akunPenerimaId, ...data.details.map(d => d.akunId)]
  
  // Cek apakah ada akun yang unitSekolahId-nya tidak sesuai dengan unitToSave (dan bukan global)
  const invalidAccounts = await prisma.akunDetail.findMany({
    where: {
      id: { in: allAccountIds },
      unitSekolahId: {
        notIn: unitToSave ? [unitToSave] : [] // Bukan milik unit ini
      }
    }
  })

  if (invalidAccounts.length > 0) {
    throw new Error(`Transaksi ditolak: Terdapat akun (${invalidAccounts.map(a => a.nama).join(", ")}) yang bukan milik unit transaksi ini.`)
  }

  // Start a transaction for Double Entry Bookkeeping
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the Header Transaksi
    const transaksi = await tx.transaksi.create({
      data: {
        noReferensi: data.noReferensi,
        noFormulir: data.noFormulir || null,
        tanggal: data.tanggal,
        jenis: "KAS_MASUK",
        sumber: data.sumber || "MANUAL",
        deskripsi: data.deskripsi,
        totalNilai: totalNilai,
        status: "POSTED",
        namaPihakKetiga: data.namaPihakKetiga || null,
        unitSekolahId: unitToSave,
        pembuatId: tenant.user.id,
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
      penggunaId: tenant.user.id,
      aksi: "CREATE",
      modul: "KAS_MASUK",
      keterangan: `Membuat penerimaan kas masuk (No Ref: ${data.noReferensi}) sebesar Rp ${totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  return result
}

export async function hapusKasMasuk(id: string) {
  const tenant = await getTenantContext()
  const userRole = tenant.role?.toUpperCase()?.trim()

  if (userRole !== "ADMIN" && userRole !== "TATA_USAHA") {
    throw new Error("Hanya Administrator atau Tata Usaha yang dapat menghapus transaksi kas masuk")
  }

  const tx = await prisma.transaksi.findUnique({ 
    where: { id },
    include: {
      pembayaranTagihan: true
    }
  })
  if (!tx) throw new Error("Transaksi tidak ditemukan")

  // Isolasi Multi-Tenant: Tata Usaha hanya boleh menghapus transaksi dari unit sekolahnya sendiri
  if (userRole !== "ADMIN" && tenant.unitId && tx.unitSekolahId && tx.unitSekolahId !== tenant.unitId) {
    throw new Error("Akses ditolak: Anda hanya dapat menghapus transaksi dari unit sekolah Anda sendiri")
  }

  await prisma.$transaction(async (prismaTx) => {
    // 1. REVERSAL ATOMIK: Jika transaksi ini berasal dari pembayaran tagihan siswa,
    // kembalikan saldo sisaTagihan dan status Tagihan agar tidak menjadi yatim/terkunci
    if (tx.pembayaranTagihan && tx.pembayaranTagihan.length > 0) {
      for (const p of tx.pembayaranTagihan) {
        const tagihan = await prismaTx.tagihan.findUnique({
          where: { id: p.tagihanId }
        })

        if (tagihan) {
          const totalDipulihkan = p.jumlahDibayar + (p.potongan || 0)
          const newSisa = Math.min(tagihan.jumlah, tagihan.sisaTagihan + totalDipulihkan)
          const newStatus = newSisa >= tagihan.jumlah 
            ? "BELUM_LUNAS" 
            : newSisa > 0 
              ? "SEBAGIAN" 
              : "LUNAS"

          await prismaTx.tagihan.update({
            where: { id: p.tagihanId },
            data: {
              sisaTagihan: newSisa,
              status: newStatus
            }
          })
        }
      }
    }

    // 2. Hapus Transaksi (otomatis cascade delete ke PembayaranTagihanDetail & TransaksiDetail)
    await prismaTx.transaksi.delete({ where: { id } })
  })

  await prisma.logAktivitas.create({
    data: {
      penggunaId: tenant.user.id,
      aksi: "DELETE",
      modul: "KAS_MASUK",
      keterangan: `Menghapus penerimaan kas masuk (No Ref: ${tx.noReferensi}) sebesar Rp ${tx.totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  revalidatePath("/pembayaran-tagihan")
  return true
}

export async function getKasMasukById(id: string) {
  const tenant = await getTenantContext()

  const tx = await prisma.transaksi.findUnique({
    where: { id },
    include: {
      pembuat: { select: { name: true } },
      unitSekolah: true,
      detail: {
        include: {
          akun: {
            select: { id: true, kode: true, nama: true }
          }
        }
      },
      pembayaranTagihan: {
        include: {
          tagihan: {
            include: {
              akun: true,
              murid: true
            }
          }
        }
      }
    }
  })

  if (!tx) throw new Error("Transaksi tidak ditemukan")
  return tx
}

export async function updateKasMasuk(id: string, data: KasMasukPayload) {
  const tenant = await getTenantContext()
  
  if (!data.details || data.details.length === 0) {
    throw new Error("Harus ada minimal satu baris pembukuan")
  }

  const existingTx = await prisma.transaksi.findUnique({
    where: { id },
    include: { detail: true }
  })

  if (!existingTx) throw new Error("Transaksi tidak ditemukan")

  if (tenant.role === "TATA_USAHA" && existingTx.unitSekolahId !== tenant.unitId) {
    throw new Error("Anda tidak berhak mengubah transaksi unit lain.")
  }

  // KHUSUS TRANSAKSI SUMBER TAGIHAN:
  // Jangan rombak struktur detail pembukuan (KREDIT Pendapatan & DEBIT Beban Potongan) agar pembukuan tagihan siswa tetap utuh.
  // Hanya perbarui header tanggal transaksi, nama penyetor, keterangan, nomor formulir, dan dompet kas/bank jika diganti.
  if (existingTx.sumber === "TAGIHAN") {
    const result = await prisma.$transaction(async (tx) => {
      if (data.akunPenerimaId) {
        const existingKasDetail = await tx.transaksiDetail.findFirst({
          where: {
            transaksiId: id,
            posisi: "DEBIT",
            akun: { isKasBank: true }
          }
        })
        if (existingKasDetail && existingKasDetail.akunId !== data.akunPenerimaId) {
          await tx.transaksiDetail.update({
            where: { id: existingKasDetail.id },
            data: { akunId: data.akunPenerimaId }
          })
        }
      }

      return await tx.transaksi.update({
        where: { id },
        data: {
          tanggal: data.tanggal,
          deskripsi: data.deskripsi,
          namaPihakKetiga: data.namaPihakKetiga || null,
          noFormulir: data.noFormulir || null,
          isEdited: true,
          editReason: "Diedit melalui halaman Ubah Kas Masuk"
        }
      })
    })

    await prisma.logAktivitas.create({
      data: {
        penggunaId: tenant.user.id,
        aksi: "UPDATE",
        modul: "KAS_MASUK",
        keterangan: `Mengubah tanggal/keterangan transaksi tagihan (No Ref: ${existingTx.noReferensi})`
      }
    })

    revalidatePath("/kas-masuk")
    revalidatePath(`/kas-masuk/${id}`)
    revalidatePath("/pembayaran-tagihan")
    return result
  }

  const totalNilai = data.details.reduce((sum, item) => sum + item.nilai, 0)

  // VALIDASI ISOLASI AKUN KEUANGAN (Prioritas 5)
  const unitToSave = data.unitSekolahId !== undefined ? data.unitSekolahId : existingTx.unitSekolahId
  const allAccountIds = [data.akunPenerimaId, ...data.details.map(d => d.akunId)]
  
  const invalidAccounts = await prisma.akunDetail.findMany({
    where: {
      id: { in: allAccountIds },
      unitSekolahId: {
        notIn: unitToSave ? [unitToSave] : []
      }
    }
  })

  if (invalidAccounts.length > 0) {
    throw new Error(`Transaksi ditolak: Terdapat akun (${invalidAccounts.map(a => a.nama).join(", ")}) yang bukan milik unit transaksi ini.`)
  }
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the Header Transaksi
    const updatedTransaksi = await tx.transaksi.update({
      where: { id },
      data: {
        tanggal: data.tanggal,
        deskripsi: data.deskripsi,
        totalNilai: totalNilai,
        namaPihakKetiga: data.namaPihakKetiga || null,
        noFormulir: data.noFormulir || null,
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
      penggunaId: tenant.user.id,
      aksi: "UPDATE",
      modul: "KAS_MASUK",
      keterangan: `Mengubah penerimaan kas masuk (No Ref: ${existingTx.noReferensi}) menjadi Rp ${totalNilai.toLocaleString('id-ID')}`
    }
  })

  revalidatePath("/kas-masuk")
  revalidatePath(`/kas-masuk/${id}`)
  return result
}
