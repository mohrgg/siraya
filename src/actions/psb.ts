"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { format } from "date-fns"
import { revalidatePath, unstable_noStore } from "next/cache"
import { getTenantContext } from "@/lib/tenant"

// ==========================================
// 1. HELPER COA & TRANSAKSI
// ==========================================

async function generateNoReferensi(tx: any, tanggal: Date) {
  const yearMonth = format(tanggal, "yyMM")
  const prefix = `KM-${yearMonth}-`

  const lastTransaksi = await tx.transaksi.findFirst({
    where: {
      noReferensi: {
        startsWith: prefix
      }
    },
    orderBy: {
      noReferensi: "desc"
    }
  })

  if (!lastTransaksi) {
    return `${prefix}0001`
  }

  const parts = lastTransaksi.noReferensi.split("-")
  const lastNumber = parseInt(parts[2] || "0", 10)
  const nextNumber = lastNumber + 1
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`
}

async function getOrCreateSubKlasifikasiPendapatan(tx: any, unitSekolahId: string) {
  let sub = await tx.subKlasifikasiAkun.findFirst({
    where: {
      unitSekolahId,
      kode: "41"
    }
  })

  if (!sub) {
    let klasifikasi = await tx.klasifikasiAkun.findFirst({
      where: { unitSekolahId, kode: "4" }
    })
    if (!klasifikasi) {
      klasifikasi = await tx.klasifikasiAkun.create({
        data: {
          unitSekolahId,
          kode: "4",
          nama: "PENDAPATAN"
        }
      })
    }
    sub = await tx.subKlasifikasiAkun.create({
      data: {
        unitSekolahId,
        klasifikasiAkunId: klasifikasi.id,
        kode: "41",
        nama: "Pendapatan Operasional"
      }
    })
  }

  return sub
}

export async function getOrCreateAkunPendapatanFormulir(tx: any, unitSekolahId: string) {
  let akun = await tx.akunDetail.findFirst({
    where: {
      unitSekolahId,
      isActive: true,
      OR: [
        { kode: "4103" },
        { nama: { contains: "Formulir", mode: "insensitive" } }
      ]
    }
  })

  if (!akun) {
    const sub = await getOrCreateSubKlasifikasiPendapatan(tx, unitSekolahId)
    akun = await tx.akunDetail.create({
      data: {
        unitSekolahId,
        subKlasifikasiAkunId: sub.id,
        kode: "4103",
        nama: "Pendapatan Formulir Pendaftaran",
        isKasBank: false,
        isSPP: false,
        isActive: true
      }
    })
  }

  return akun
}

export async function getOrCreateAkunUangPangkal(tx: any, unitSekolahId: string) {
  let akun = await tx.akunDetail.findFirst({
    where: {
      unitSekolahId,
      isActive: true,
      OR: [
        { kode: "4104" },
        { nama: { contains: "Uang Pangkal", mode: "insensitive" } },
        { nama: { contains: "PSB", mode: "insensitive" } },
        { nama: { contains: "Daftar Ulang", mode: "insensitive" } }
      ]
    }
  })

  if (!akun) {
    const sub = await getOrCreateSubKlasifikasiPendapatan(tx, unitSekolahId)
    akun = await tx.akunDetail.create({
      data: {
        unitSekolahId,
        subKlasifikasiAkunId: sub.id,
        kode: "4104",
        nama: "Pendapatan Uang Pangkal / Daftar Ulang",
        isKasBank: false,
        isSPP: false,
        isActive: true
      }
    })
  }

  return akun
}

// ==========================================
// 2. GELOMBANG PSB (CRUD)
// ==========================================

export async function getGelombangPSBList(unitSekolahId?: string) {
  unstable_noStore()
  const tenant = await getTenantContext()

  const where: any = { isDeleted: false }
  const targetUnitId = unitSekolahId !== undefined && unitSekolahId !== "all" 
    ? unitSekolahId 
    : (!tenant.isGlobal ? tenant.unitId : undefined)

  if (targetUnitId) {
    where.unitSekolahId = targetUnitId
  }

  return prisma.gelombangPSB.findMany({
    where,
    include: {
      unitSekolah: { select: { id: true, name: true, level: true } },
      tahunAkademik: { select: { id: true, name: true } },
      _count: {
        select: {
          pendaftar: true
        }
      }
    },
    orderBy: [
      { isActive: "desc" },
      { tanggalMulai: "desc" }
    ]
  })
}

export async function getGelombangAktif(unitSekolahId: string, tahunAkademikId?: string) {
  unstable_noStore()
  const where: any = {
    unitSekolahId,
    isActive: true,
    isDeleted: false
  }

  if (tahunAkademikId) {
    where.tahunAkademikId = tahunAkademikId
  }

  return prisma.gelombangPSB.findMany({
    where,
    orderBy: { tanggalMulai: "asc" }
  })
}

export async function simpanGelombangPSB(data: {
  id?: string
  unitSekolahId: string
  tahunAkademikId: string
  namaGelombang: string
  tanggalMulai: Date | string
  tanggalSelesai: Date | string
  biayaFormulir: number
  biayaUangPangkal: number
  diskonUangPangkal?: number
  kuota?: number
  isActive?: boolean
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const tanggalMulai = new Date(data.tanggalMulai)
  const tanggalSelesai = new Date(data.tanggalSelesai)

  if (data.id) {
    const updated = await prisma.gelombangPSB.update({
      where: { id: data.id },
      data: {
        namaGelombang: data.namaGelombang,
        tanggalMulai,
        tanggalSelesai,
        biayaFormulir: data.biayaFormulir,
        biayaUangPangkal: data.biayaUangPangkal,
        diskonUangPangkal: data.diskonUangPangkal || 0,
        kuota: data.kuota || 0,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
    revalidatePath("/psb", "layout")
    return updated
  } else {
    const created = await prisma.gelombangPSB.create({
      data: {
        unitSekolahId: data.unitSekolahId,
        tahunAkademikId: data.tahunAkademikId,
        namaGelombang: data.namaGelombang,
        tanggalMulai,
        tanggalSelesai,
        biayaFormulir: data.biayaFormulir,
        biayaUangPangkal: data.biayaUangPangkal,
        diskonUangPangkal: data.diskonUangPangkal || 0,
        kuota: data.kuota || 0,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
    revalidatePath("/psb", "layout")
    return created
  }
}

export async function toggleStatusGelombangPSB(id: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const g = await prisma.gelombangPSB.findUnique({ where: { id } })
  if (!g) throw new Error("Gelombang tidak ditemukan.")

  const updated = await prisma.gelombangPSB.update({
    where: { id },
    data: { isActive: !g.isActive }
  })
  revalidatePath("/psb", "layout")
  return updated
}

export async function hapusGelombangPSB(id: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const countPendaftar = await prisma.pendaftarPSB.count({ where: { gelombangId: id } })
  if (countPendaftar > 0) {
    throw new Error(`Tidak dapat menghapus gelombang ini karena sudah memiliki ${countPendaftar} data pendaftar. Nonaktifkan saja gelombangnya.`)
  }

  const updated = await prisma.gelombangPSB.update({
    where: { id },
    data: { isDeleted: true, isActive: false }
  })
  revalidatePath("/psb", "layout")
  return updated
}

// ==========================================
// 3. LOKET PEMBELIAN FORMULIR & PENDAFTAR
// ==========================================

export async function getPendaftarPSBList(params?: {
  page?: number
  limit?: number
  unitSekolahId?: string
  tahunAkademikId?: string
  gelombangId?: string
  status?: string
  search?: string
}) {
  unstable_noStore()
  const tenant = await getTenantContext()

  const page = Math.max(1, params?.page || 1)
  const limit = Math.max(5, Math.min(100, params?.limit || 20))
  const skip = (page - 1) * limit

  const where: any = {}

  const targetUnitId = params?.unitSekolahId !== undefined && params?.unitSekolahId !== "all"
    ? params?.unitSekolahId
    : (!tenant.isGlobal ? tenant.unitId : undefined)

  if (targetUnitId) {
    where.unitSekolahId = targetUnitId
  }

  if (params?.tahunAkademikId && params.tahunAkademikId !== "all") {
    where.tahunAkademikId = params.tahunAkademikId
  }

  if (params?.gelombangId && params.gelombangId !== "all") {
    where.gelombangId = params.gelombangId
  }

  if (params?.status && params.status !== "ALL") {
    where.status = params.status
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.trim()
    where.OR = [
      { nomorFormulir: { contains: q, mode: "insensitive" } },
      { namaCalon: { contains: q, mode: "insensitive" } },
      { namaOrangTua: { contains: q, mode: "insensitive" } },
      { noWhatsapp: { contains: q, mode: "insensitive" } },
      { nisn: { contains: q, mode: "insensitive" } }
    ]
  }

  const [total, items] = await Promise.all([
    prisma.pendaftarPSB.count({ where }),
    prisma.pendaftarPSB.findMany({
      where,
      include: {
        gelombang: {
          select: {
            id: true,
            namaGelombang: true,
            biayaFormulir: true,
            biayaUangPangkal: true,
            diskonUangPangkal: true
          }
        },
        unitSekolah: { select: { id: true, name: true, level: true } },
        tahunAkademik: { select: { id: true, name: true } },
        transaksiFormulir: {
          select: {
            id: true,
            noReferensi: true,
            totalNilai: true,
            tanggal: true
          }
        },
        murid: {
          select: {
            id: true,
            name: true,
            nis: true,
            riwayatKelas: {
              where: { isCurrent: true },
              select: { subKelas: { select: { id: true, name: true } } },
              take: 1
            },
            tagihan: {
              select: {
                id: true,
                namaTagihan: true,
                jumlah: true,
                sisaTagihan: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function beliFormulirPSB(data: {
  unitSekolahId: string
  tahunAkademikId: string
  gelombangId: string
  nomorFormulir: string
  namaCalon: string
  jenisKelamin?: string
  nisn?: string
  nik?: string
  asalSekolah?: string
  namaOrangTua: string
  noWhatsapp: string
  alamat?: string
  akunKasId: string
  tanggal: Date | string
  biayaFormulir?: number
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const userId = (session.user as any).id
  const tanggalTransaksi = new Date(data.tanggal || new Date())
  const cleanNomorFormulir = data.nomorFormulir.trim()

  if (!cleanNomorFormulir) throw new Error("Nomor formulir wajib diisi.")
  if (!data.namaCalon.trim()) throw new Error("Nama calon murid wajib diisi.")
  if (!data.namaOrangTua.trim()) throw new Error("Nama orang tua/wali wajib diisi.")
  if (!data.noWhatsapp.trim()) throw new Error("Nomor WhatsApp wajib diisi.")
  if (!data.akunKasId) throw new Error("Akun Kas/Bank penerima wajib dipilih.")

  const result = await prisma.$transaction(async (tx) => {
    // 1. Cek duplikasi nomor formulir fisik di unit & tahun akademik yang sama
    const duplicate = await tx.pendaftarPSB.findFirst({
      where: {
        nomorFormulir: cleanNomorFormulir,
        unitSekolahId: data.unitSekolahId,
        tahunAkademikId: data.tahunAkademikId
      }
    })
    if (duplicate) {
      throw new Error(`Nomor formulir "${cleanNomorFormulir}" sudah terdaftar untuk calon siswa: ${duplicate.namaCalon}.`)
    }

    // 2. Ambil data gelombang
    const gelombang = await tx.gelombangPSB.findUnique({
      where: { id: data.gelombangId }
    })
    if (!gelombang) throw new Error("Gelombang pendaftaran tidak ditemukan.")

    const nominalBiaya = data.biayaFormulir !== undefined ? data.biayaFormulir : gelombang.biayaFormulir

    // 3. Ambil/buat Akun Pendapatan Formulir
    const akunPendapatan = await getOrCreateAkunPendapatanFormulir(tx, data.unitSekolahId)

    // 4. Generate Nomor Referensi Transaksi
    const noRef = await generateNoReferensi(tx, tanggalTransaksi)

    // 5. Catat Transaksi KAS_MASUK
    const deskripsiTransaksi = `Pembelian Formulir PSB No. ${cleanNomorFormulir} - Calon: ${data.namaCalon.trim()}`
    const transaksi = await tx.transaksi.create({
      data: {
        noReferensi: noRef,
        noFormulir: cleanNomorFormulir,
        tanggal: tanggalTransaksi,
        jenis: "KAS_MASUK",
        sumber: "PSB_FORMULIR",
        deskripsi: deskripsiTransaksi,
        totalNilai: nominalBiaya,
        status: "POSTED",
        namaPihakKetiga: data.namaOrangTua.trim(),
        unitSekolahId: data.unitSekolahId,
        pembuatId: userId
      }
    })

    // 6. Catat Jurnal Detail: DEBIT Kas/Bank, KREDIT Pendapatan Formulir
    await tx.transaksiDetail.createMany({
      data: [
        {
          transaksiId: transaksi.id,
          akunId: data.akunKasId,
          posisi: "DEBIT",
          nilai: nominalBiaya,
          deskripsi: `Penerimaan Kas Pembelian Formulir No. ${cleanNomorFormulir}`
        },
        {
          transaksiId: transaksi.id,
          akunId: akunPendapatan.id,
          posisi: "KREDIT",
          nilai: nominalBiaya,
          deskripsi: `Pendapatan Formulir PSB No. ${cleanNomorFormulir}`
        }
      ]
    })

    // 7. Simpan Calon Murid di Tabel Staging PendaftarPSB
    const pendaftar = await tx.pendaftarPSB.create({
      data: {
        nomorFormulir: cleanNomorFormulir,
        gelombangId: data.gelombangId,
        unitSekolahId: data.unitSekolahId,
        tahunAkademikId: data.tahunAkademikId,
        namaCalon: data.namaCalon.trim(),
        jenisKelamin: data.jenisKelamin,
        nisn: data.nisn?.trim() || null,
        nik: data.nik?.trim() || null,
        asalSekolah: data.asalSekolah?.trim() || null,
        namaOrangTua: data.namaOrangTua.trim(),
        noWhatsapp: data.noWhatsapp.trim(),
        alamat: data.alamat?.trim() || null,
        transaksiFormulirId: transaksi.id,
        status: "FORMULIR_DIBELI"
      }
    })

    // 8. Catat Audit Log
    await tx.logAktivitas.create({
      data: {
        penggunaId: userId,
        aksi: "BELI_FORMULIR_PSB",
        modul: "PSB",
        keterangan: `Menerbitkan formulir fisik No. ${cleanNomorFormulir} untuk calon ${pendaftar.namaCalon} sebesar Rp ${nominalBiaya.toLocaleString("id-ID")}`
      }
    })

    return { pendaftar, transaksi }
  })

  revalidatePath("/psb", "layout")
  revalidatePath("/(dashboard)/(keuangan)/kas-masuk", "page")
  return result
}

export async function batalPendaftarPSB(id: string, alasan?: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const pendaftar = await prisma.pendaftarPSB.findUnique({
    where: { id },
    include: { murid: true }
  })
  if (!pendaftar) throw new Error("Data pendaftar tidak ditemukan.")
  if (pendaftar.status === "SISWA_AKTIF") {
    throw new Error("Siswa sudah aktif di database akademik. Lakukan mutasi/keluar lewat menu kesiswaan.")
  }

  const updated = await prisma.pendaftarPSB.update({
    where: { id },
    data: {
      status: "BATAL",
      keteranganDiskon: alasan ? `Batal: ${alasan}` : pendaftar.keteranganDiskon
    }
  })

  revalidatePath("/psb", "layout")
  return updated
}

// ==========================================
// 4. VERIFIKASI BERKAS & AKTIVASI MURID (SPRINT 3)
// ==========================================

export async function verifikasiBerkasPSB(id: string, data?: {
  diskonKustom?: number
  keteranganDiskon?: string
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const pendaftar = await prisma.pendaftarPSB.findUnique({ where: { id } })
  if (!pendaftar) throw new Error("Data pendaftar tidak ditemukan.")

  const updated = await prisma.pendaftarPSB.update({
    where: { id },
    data: {
      status: "BERKAS_KEMBALI",
      diskonKustom: data?.diskonKustom !== undefined ? data.diskonKustom : pendaftar.diskonKustom,
      keteranganDiskon: data?.keteranganDiskon || pendaftar.keteranganDiskon
    }
  })

  revalidatePath("/psb", "layout")
  return updated
}

export async function prosesAktivasiMuridDanBayarPSB(data: {
  pendaftarId: string
  jumlahBayar: number
  akunKasId: string
  tanggalBayar: Date | string
  subKelasId?: string
  diskonKustom?: number
  keteranganDiskon?: string
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  const userId = (session.user as any).id
  const tanggal = new Date(data.tanggalBayar || new Date())

  const result = await prisma.$transaction(async (tx) => {
    // 1. Ambil pendaftar
    const pendaftar = await tx.pendaftarPSB.findUnique({
      where: { id: data.pendaftarId },
      include: {
        gelombang: true,
        unitSekolah: true,
        tahunAkademik: true
      }
    })
    if (!pendaftar) throw new Error("Data pendaftar tidak ditemukan.")
    if (pendaftar.muridId) throw new Error("Calon siswa ini sudah diaktifkan sebelumnya.")

    // 2. Hitung Nominal Tagihan Uang Pangkal
    const biayaKotor = pendaftar.gelombang.biayaUangPangkal
    const diskonGelombang = pendaftar.gelombang.diskonUangPangkal || 0
    const diskonKustom = data.diskonKustom !== undefined ? data.diskonKustom : pendaftar.diskonKustom
    const tagihanBersih = Math.max(0, biayaKotor - diskonGelombang - diskonKustom)

    if (data.jumlahBayar < 0) throw new Error("Jumlah pembayaran tidak boleh negatif.")
    if (data.jumlahBayar > tagihanBersih) {
      throw new Error(`Jumlah pembayaran (Rp ${data.jumlahBayar.toLocaleString("id-ID")}) melebihi total tagihan bersih (Rp ${tagihanBersih.toLocaleString("id-ID")}).`)
    }

    // 3. Tentukan SubKelas Target (Kelas Sementara PSB atau SubKelas Definitif)
    let targetSubKelasId = data.subKelasId
    if (!targetSubKelasId) {
      // Cari atau buat otomatis "Kelas Sementara PSB [Unit] [T.A]"
      let tingkatAwal = await tx.tingkat.findFirst({
        where: { unitSekolahId: pendaftar.unitSekolahId, isDeleted: false },
        orderBy: { order: "asc" }
      })
      if (!tingkatAwal) {
        tingkatAwal = await tx.tingkat.create({
          data: {
            unitSekolahId: pendaftar.unitSekolahId,
            name: "Calon Siswa",
            order: 0
          }
        })
      }

      const tempKelasName = `PSB Sementara ${pendaftar.unitSekolah.name}`
      let tempKelas = await tx.subKelas.findFirst({
        where: {
          unitSekolahId: pendaftar.unitSekolahId,
          tahunAkademikId: pendaftar.tahunAkademikId,
          name: tempKelasName,
          isDeleted: false
        }
      })

      if (!tempKelas) {
        tempKelas = await tx.subKelas.create({
          data: {
            unitSekolahId: pendaftar.unitSekolahId,
            tingkatId: tingkatAwal.id,
            tahunAkademikId: pendaftar.tahunAkademikId,
            name: tempKelasName
          }
        })
      }
      targetSubKelasId = tempKelas.id
    }

    // 4. Buat Murid resmi di database akademik
    const murid = await tx.murid.create({
      data: {
        name: pendaftar.namaCalon,
        gender: pendaftar.jenisKelamin,
        nisn: pendaftar.nisn,
        nik: pendaftar.nik,
        birthPlace: pendaftar.tempatLahir,
        birthDate: pendaftar.tanggalLahir,
        formNo: pendaftar.nomorFormulir,
        parentPhone: pendaftar.noWhatsapp,
        address: pendaftar.alamat,
        previousSchool: pendaftar.asalSekolah,
        fatherName: pendaftar.namaOrangTua,
        unitSekolahId: pendaftar.unitSekolahId,
        status: "AKTIF",
        isActive: true
      }
    })

    // 5. Masukkan Murid ke RiwayatKelas
    await tx.riwayatKelas.create({
      data: {
        muridId: murid.id,
        subKelasId: targetSubKelasId,
        tahunAkademikId: pendaftar.tahunAkademikId,
        isCurrent: true
      }
    })

    // 6. Ambil Akun Pendapatan Uang Pangkal
    const akunUangPangkal = await getOrCreateAkunUangPangkal(tx, pendaftar.unitSekolahId)

    // 7. Buat Tagihan Uang Pangkal
    const namaTagihan = `Uang Pangkal PSB - ${pendaftar.gelombang.namaGelombang}`
    const tagihan = await tx.tagihan.create({
      data: {
        muridId: murid.id,
        akunId: akunUangPangkal.id,
        tahunAkademikId: pendaftar.tahunAkademikId,
        namaTagihan,
        jumlah: tagihanBersih,
        sisaTagihan: tagihanBersih,
        status: "BELUM_LUNAS"
      }
    })

    // 8. Jika ada pembayaran (sebagian atau lunas), catat Kas Masuk
    if (data.jumlahBayar > 0) {
      if (!data.akunKasId) throw new Error("Akun Kas/Bank penerima wajib dipilih.")

      const noRef = await generateNoReferensi(tx, tanggal)
      const transaksi = await tx.transaksi.create({
        data: {
          noReferensi: noRef,
          tanggal,
          jenis: "KAS_MASUK",
          sumber: "TAGIHAN",
          deskripsi: `Pembayaran ${namaTagihan} - Siswa: ${murid.name}`,
          totalNilai: data.jumlahBayar,
          status: "POSTED",
          namaPihakKetiga: murid.name,
          unitSekolahId: pendaftar.unitSekolahId,
          pembuatId: userId
        }
      })

      // Jurnal Detail Kas Masuk
      await tx.transaksiDetail.createMany({
        data: [
          {
            transaksiId: transaksi.id,
            akunId: data.akunKasId,
            posisi: "DEBIT",
            nilai: data.jumlahBayar,
            deskripsi: `Penerimaan Kas ${namaTagihan}`
          },
          {
            transaksiId: transaksi.id,
            akunId: akunUangPangkal.id,
            posisi: "KREDIT",
            nilai: data.jumlahBayar,
            deskripsi: `Pendapatan ${namaTagihan}`
          }
        ]
      })

      // Sambungkan ke PembayaranTagihanDetail
      await tx.pembayaranTagihanDetail.create({
        data: {
          tagihanId: tagihan.id,
          transaksiId: transaksi.id,
          jumlahDibayar: data.jumlahBayar
        }
      })

      // Update Sisa Tagihan & Status
      const sisa = tagihanBersih - data.jumlahBayar
      await tx.tagihan.update({
        where: { id: tagihan.id },
        data: {
          sisaTagihan: sisa,
          status: sisa <= 0 ? "LUNAS" : "SEBAGIAN"
        }
      })
    }

    // 9. Update PendaftarPSB -> SISWA_AKTIF dan link ke muridId
    await tx.pendaftarPSB.update({
      where: { id: pendaftar.id },
      data: {
        status: "SISWA_AKTIF",
        diskonKustom,
        keteranganDiskon: data.keteranganDiskon || pendaftar.keteranganDiskon,
        muridId: murid.id
      }
    })

    // 10. Audit Log
    await tx.logAktivitas.create({
      data: {
        penggunaId: userId,
        aksi: "AKTIVASI_MURID_PSB",
        modul: "PSB",
        keterangan: `Mengaktifkan calon siswa ${murid.name} (Formulir: ${pendaftar.nomorFormulir}) menjadi siswa aktif dan menerbitkan tagihan ${namaTagihan} sebesar Rp ${tagihanBersih.toLocaleString("id-ID")}`
      }
    })

    return { murid, tagihan }
  })

  revalidatePath("/psb", "layout")
  revalidatePath("/(dashboard)/(keuangan)/kas-masuk", "page")
  revalidatePath("/(dashboard)/(keuangan)/pembayaran-tagihan", "page")
  revalidatePath("/(dashboard)/(akademik)/siswa", "page")
  return result
}
