"use server"

import prisma from "@/lib/prisma"
import { revalidatePath, unstable_noStore } from "next/cache"
import { format } from "date-fns"
import { auth } from "@/lib/auth"
import { buildDeskripsiPembayaranTagihan } from "@/lib/tagihan-helpers"

export async function getAkunKasBankList(unitSekolahId?: string) {
  unstable_noStore()
  try {
    const isGlobal = !unitSekolahId || unitSekolahId === "all"
    const data = await prisma.akunDetail.findMany({
      where: {
        isKasBank: true,
        isActive: true,
        subKlasifikasi: {
          klasifikasi: {
            kode: "1" // Wajib Aset / Harta
          }
        },
        ...(isGlobal ? {} : { unitSekolahId })
      },
      select: {
        id: true,
        nama: true,
        kode: true
      },
      orderBy: {
        kode: "asc"
      }
    })
    return data
  } catch (error) {
    console.error("Error getAkunKasBankList:", error)
    return []
  }
}

export async function getMuridWithTagihanUnpaid(filters: { 
  unitSekolahId: string, 
  tahunAkademikId: string, 
  kelasId?: string, 
  subKelasId?: string,
  searchName?: string
}) {
  unstable_noStore()
  try {
    const hasSearch = !!(filters.searchName && filters.searchName.trim() !== "")
    const q = hasSearch ? filters.searchName!.trim() : ""
    const isGlobal = !filters.unitSekolahId || filters.unitSekolahId === "all"

    const whereClause: any = {
      status: "AKTIF",
      isDeleted: false
    }

    if (!isGlobal) {
      whereClause.unitSekolahId = filters.unitSekolahId
    }

    if (hasSearch) {
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { nisn: { contains: q, mode: "insensitive" } },
        { formNo: { contains: q, mode: "insensitive" } }
      ]
      if (filters.subKelasId) {
        whereClause.riwayatKelas = {
          some: {
            subKelasId: filters.subKelasId,
            ...(filters.tahunAkademikId ? { tahunAkademikId: filters.tahunAkademikId } : {}),
            isCurrent: true,
            subKelas: { isDeleted: false }
          }
        }
      }
    } else {
      whereClause.riwayatKelas = {
        some: {
          tahunAkademikId: filters.tahunAkademikId,
          isCurrent: true,
          subKelas: {
            isDeleted: false,
            ...(filters.kelasId && !filters.subKelasId ? { tingkatId: filters.kelasId } : {})
          },
          ...(filters.subKelasId ? { subKelasId: filters.subKelasId } : {})
        }
      }
    }

    const data = await prisma.murid.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nisn: true,
        formNo: true,
        riwayatKelas: {
          where: { 
            isCurrent: true,
            subKelas: { isDeleted: false }
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            subKelas: {
              select: {
                id: true,
                name: true,
                tingkat: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          take: 1
        },
        tagihan: {
          where: {
            tahunAkademikId: filters.tahunAkademikId
          },
          select: {
            id: true,
            jumlah: true,
            sisaTagihan: true,
            status: true,
            akunId: true,
            namaTagihan: true,
            akun: {
              select: {
                id: true,
                nama: true,
                kode: true
              }
            }
          }
        },
        _count: {
          select: {
            tagihan: {
              where: {
                sisaTagihan: { gt: 0 },
                tahunAkademikId: { not: filters.tahunAkademikId }
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return data
  } catch (error: any) {
    console.error("Error getMuridWithTagihanUnpaid:", error)
    throw new Error(error.message || "Gagal mengambil data murid dan tagihan")
  }
}

async function getOrCreateAkunPotongan(client: any = prisma, unitSekolahId: string) {
  // 1. Cari apakah sudah ada akun Beban Potongan/Beasiswa di unit ini
  const existing = await client.akunDetail.findFirst({
    where: {
      unitSekolahId,
      isActive: true,
      OR: [
        { kode: "5199" },
        { nama: { contains: "Potongan", mode: "insensitive" } },
        { nama: { contains: "Beasiswa", mode: "insensitive" } }
      ],
      subKlasifikasi: {
        klasifikasi: {
          kode: "5" // Kelompok BEBAN
        }
      }
    }
  })

  if (existing) return existing

  // 2. Jika belum ada, pastikan Klasifikasi '5' (BEBAN (BIAYA)) ada
  let klasifikasiBeban = await client.klasifikasiAkun.findFirst({
    where: {
      kode: "5",
      unitSekolahId
    }
  })

  if (!klasifikasiBeban) {
    klasifikasiBeban = await client.klasifikasiAkun.create({
      data: {
        kode: "5",
        nama: "BEBAN (BIAYA)",
        unitSekolahId
      }
    })
  }

  // 3. Pastikan SubKlasifikasi '51' (Beban Operasional / Beban) ada
  let subBeban = await client.subKlasifikasiAkun.findFirst({
    where: {
      kode: "51",
      unitSekolahId
    }
  })

  if (!subBeban) {
    subBeban = await client.subKlasifikasiAkun.findFirst({
      where: {
        klasifikasiAkunId: klasifikasiBeban.id,
        unitSekolahId
      }
    })
  }

  if (!subBeban) {
    subBeban = await client.subKlasifikasiAkun.create({
      data: {
        kode: "51",
        nama: "Beban Operasional",
        klasifikasiAkunId: klasifikasiBeban.id,
        unitSekolahId
      }
    })
  }

  // 4. Buat AkunDetail '5199'
  let kodeAkun = "5199"
  const kodeUsed = await client.akunDetail.findUnique({
    where: {
      kode_unitSekolahId: {
        kode: kodeAkun,
        unitSekolahId
      }
    }
  })
  if (kodeUsed) {
    kodeAkun = "5198"
  }

  return await client.akunDetail.create({
    data: {
      kode: kodeAkun,
      nama: "Beban Beasiswa & Potongan Siswa",
      subKlasifikasiAkunId: subBeban.id,
      unitSekolahId,
      isKasBank: false,
      isSPP: false,
      isActive: true
    }
  })
}

/**
 * Menghasilkan nomor referensi pembayaran tagihan secara urut dan atomik (INV-YYYYMMDD-XXXX).
 * Terisolasi dari penomoran Kas Masuk (KM-) dan Kas Keluar (KK-).
 */
export async function generateNoReferensiTagihan(
  client: any = prisma,
  tanggal: Date = new Date()
): Promise<string> {
  const dateStr = format(tanggal, "yyyyMMdd");
  const prefix = `INV-${dateStr}-`;

  const latestTx = await client.transaksi.findFirst({
    where: {
      noReferensi: {
        startsWith: prefix
      }
    },
    orderBy: {
      noReferensi: "desc"
    },
    select: {
      noReferensi: true
    }
  });

  let nextSeq = 1;
  if (latestTx?.noReferensi) {
    const parts = latestTx.noReferensi.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  // Pengecekan unik loop safeguard untuk mencegah collision jika ada data acak masa lalu atau gap
  let candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;
  while (await client.transaksi.findUnique({ where: { noReferensi: candidate }, select: { id: true } })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;
  }

  return candidate;
}

export async function prosesPembayaranTagihan(data: {
  akunKasId: string
  tanggal: Date
  deskripsi: string
  noReferensi?: string
  muridName: string
  unitSekolahId?: string
  pembuatId: string
  items: {
    tagihanId: string
    akunPendapatanId: string
    jumlahBayar: number
    potongan?: number
    kategoriPotongan?: string
    namaAkun?: string
  }[]
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  try {
    const totalBayar = data.items.reduce((sum, item) => sum + item.jumlahBayar, 0)
    const totalPotongan = data.items.reduce((sum, item) => sum + (item.potongan || 0), 0)
    
    if (totalBayar + totalPotongan <= 0) {
      throw new Error("Total pembayaran/potongan harus lebih dari 0")
    }

    // ==========================================
    // TAHAP 1: PRE-FLIGHT (DI LUAR TRANSACTION)
    // ==========================================
    // 1. Validasi Akun Kas/Bank di luar transaksi agar tidak menahan connection lock
    if (totalBayar > 0) {
      if (!data.akunKasId) {
        throw new Error("Akun Kas/Bank wajib dipilih untuk pembayaran tunai/transfer.")
      }
      const akunKas = await prisma.akunDetail.findUnique({
        where: { id: data.akunKasId },
        include: { subKlasifikasi: { include: { klasifikasi: true } } }
      })
      if (!akunKas || !akunKas.isKasBank || akunKas.subKlasifikasi?.klasifikasi?.kode !== "1") {
        throw new Error("Akun Kas/Bank tidak sah atau bukan tergolong aset kas.")
      }
    }

    // 2. Persiapkan Akun Beban Potongan/Beasiswa jika ada potongan
    let akunBebanPotonganId: string | null = null
    if (totalPotongan > 0) {
      let targetUnitId: string | undefined = data.unitSekolahId
      if (!targetUnitId && data.items.length > 0) {
        const t = await prisma.tagihan.findUnique({
          where: { id: data.items[0].tagihanId },
          include: { murid: true }
        })
        targetUnitId = t?.murid?.unitSekolahId || undefined
      }

      if (targetUnitId) {
        const akunBebanPotongan = await getOrCreateAkunPotongan(prisma, targetUnitId)
        akunBebanPotonganId = akunBebanPotongan.id
      }
    }

    // 3. Tentukan nomor referensi awal sebelum membuka transaksi
    let initialNoReferensi = data.noReferensi
    if (!initialNoReferensi || initialNoReferensi.startsWith("[Otomatis")) {
      initialNoReferensi = await generateNoReferensiTagihan(prisma, data.tanggal || new Date())
    } else {
      const isAlreadyUsed = await prisma.transaksi.findUnique({
        where: { noReferensi: initialNoReferensi },
        select: { id: true }
      })
      if (isAlreadyUsed) {
        initialNoReferensi = await generateNoReferensiTagihan(prisma, data.tanggal || new Date())
      }
    }

    // 4. Siapkan nama-nama pos tagihan untuk deskripsi spesifik
    const tagihanIds = data.items.map(i => i.tagihanId)
    const tagihanRecords = await prisma.tagihan.findMany({
      where: { id: { in: tagihanIds } },
      select: { id: true, namaTagihan: true, akun: { select: { nama: true } } }
    })
    const tagihanNameMap = new Map<string, string>()
    tagihanRecords.forEach(t => {
      tagihanNameMap.set(t.id, t.namaTagihan || t.akun.nama)
    })

    const itemsForDeskripsi = data.items.map(item => ({
      namaAkun: item.namaAkun || tagihanNameMap.get(item.tagihanId) || "Tagihan",
      jumlahBayar: item.jumlahBayar,
      potongan: item.potongan
    }))

    // Cek apakah deskripsi yang dikirim adalah custom dari user atau masih teks default/kosong
    const isDefaultOrEmpty = !data.deskripsi || 
      data.deskripsi.trim() === `Pembayaran Tagihan Siswa: ${data.muridName}` ||
      data.deskripsi.trim() === "Pembayaran Tagihan Siswa"

    const finalDeskripsi = isDefaultOrEmpty
      ? buildDeskripsiPembayaranTagihan(itemsForDeskripsi, data.muridName)
      : data.deskripsi.trim()

    // ==========================================
    // TAHAP 2: LEAN ATOMIC TRANSACTION
    // ==========================================
    let result: any
    let attempts = 0
    const maxAttempts = 3
    let currentNoReferensi = initialNoReferensi

    while (attempts < maxAttempts) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            const transaksi = await tx.transaksi.create({
              data: {
                noReferensi: currentNoReferensi,
                tanggal: data.tanggal,
                jenis: "KAS_MASUK",
                sumber: "TAGIHAN",
                deskripsi: finalDeskripsi,
                totalNilai: totalBayar,
                status: "POSTED",
                namaPihakKetiga: data.muridName,
                unitSekolahId: data.unitSekolahId,
                pembuatId: data.pembuatId
              }
            })

            // 1. DEBIT Kas/Bank jika ada uang tunai/transfer
            if (totalBayar > 0) {
              await tx.transaksiDetail.create({
                data: {
                  transaksiId: transaksi.id,
                  akunId: data.akunKasId,
                  posisi: "DEBIT",
                  nilai: totalBayar,
                  deskripsi: finalDeskripsi
                }
              })
            }

            // 2. DEBIT Beban Potongan/Beasiswa jika ada potongan
            if (totalPotongan > 0 && akunBebanPotonganId) {
              await tx.transaksiDetail.create({
                data: {
                  transaksiId: transaksi.id,
                  akunId: akunBebanPotonganId,
                  posisi: "DEBIT",
                  nilai: totalPotongan,
                  deskripsi: `Potongan/Beasiswa Tagihan Siswa: ${data.muridName}`
                }
              })
            }

            // 3. KREDIT Pendapatan Bruto per item tagihan (Jumlah Bayar + Potongan)
            for (const item of data.items) {
              const totalNilaiItem = item.jumlahBayar + (item.potongan || 0)
              if (totalNilaiItem <= 0) continue

              const itemNama = item.namaAkun || tagihanNameMap.get(item.tagihanId) || "Tagihan"

              await tx.transaksiDetail.create({
                data: {
                  transaksiId: transaksi.id,
                  akunId: item.akunPendapatanId,
                  posisi: "KREDIT",
                  nilai: totalNilaiItem,
                  deskripsi: `Pembayaran ${itemNama} - Siswa: ${data.muridName}`
                }
              })
            }

            // 4. Update Tagihan & Buat Rekam Jejak Detail Pembayaran
            for (const item of data.items) {
              const currentTagihan = await tx.tagihan.findUnique({
                where: { id: item.tagihanId }
              })
              if (!currentTagihan) {
                throw new Error(`Tagihan tidak ditemukan: ${item.tagihanId}`)
              }
              
              const totalPengurang = item.jumlahBayar + (item.potongan || 0)
              if (totalPengurang > currentTagihan.sisaTagihan) {
                throw new Error("Jumlah pembayaran dan potongan melebihi sisa tagihan")
              }

              const newSisa = currentTagihan.sisaTagihan - totalPengurang
              const newStatus = newSisa <= 0 ? "LUNAS" : "SEBAGIAN"

              await tx.tagihan.update({
                where: { id: item.tagihanId },
                data: {
                  sisaTagihan: newSisa,
                  status: newStatus
                }
              })

              await tx.pembayaranTagihanDetail.create({
                data: {
                  tagihanId: item.tagihanId,
                  transaksiId: transaksi.id,
                  jumlahDibayar: item.jumlahBayar,
                  potongan: item.potongan || 0,
                  kategoriPotongan: item.kategoriPotongan === "-" ? null : (item.kategoriPotongan || null)
                }
              })
            }

            return transaksi
          },
          {
            maxWait: 10000,
            timeout: 25000
          }
        )
        break // Transaksi berhasil, keluar dari loop retry
      } catch (err: any) {
        attempts++
        // Jika P2002 (Unique constraint failed pada noReferensi) akibat race condition, retry dengan nomor baru
        if (err?.code === "P2002" && attempts < maxAttempts) {
          currentNoReferensi = await generateNoReferensiTagihan(prisma, data.tanggal || new Date())
          continue
        }
        throw err
      }
    }

    // ==========================================
    // TAHAP 3: POST-TRANSACTION SIDE EFFECTS
    // ==========================================
    await prisma.logAktivitas.create({
      data: {
        penggunaId: (session.user as any).id,
        aksi: "CREATE",
        modul: "PEMBAYARAN_TAGIHAN",
        keterangan: `Memproses pembayaran tagihan sebesar Rp${totalBayar} (Referensi: ${result.noReferensi}) untuk siswa: ${data.muridName}`
      }
    })

    revalidatePath("/(dashboard)/(keuangan)/pembayaran-tagihan")
    revalidatePath("/(dashboard)/(keuangan)/kas-masuk")
    return { success: true, data: result }
  } catch (error: any) {
    console.error("Error prosesPembayaranTagihan:", error)
    let userFriendlyMessage = error.message || "Gagal memproses pembayaran"

    if (
      error?.message?.includes("Transaction not found") ||
      error?.message?.includes("timed out") ||
      error?.code === "P2028"
    ) {
      userFriendlyMessage = "Waktu proses transaksi database habis. Silakan periksa koneksi internet Anda dan coba beberapa saat lagi."
    } else if (error?.code === "P2002") {
      userFriendlyMessage = "Nomor referensi transaksi bertabrakan. Silakan coba kembali beberapa detik lagi."
    }

    return { 
      success: false, 
      message: userFriendlyMessage,
      error: userFriendlyMessage
    }
  }
}

export async function getRiwayatTransaksiByTagihan(tagihanId: string) {
  try {
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: tagihanId },
      include: { akun: true, murid: true }
    })

    const details = await prisma.pembayaranTagihanDetail.findMany({
      where: { tagihanId },
      include: {
        transaksi: {
          include: {
            pembayaranTagihan: {
              include: {
                tagihan: {
                  include: { akun: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    // Hitung saldo berjalan (running balance) historis per termin
    let currentBalance = tagihan?.jumlah || 0
    const detailBalanceMap = new Map<string, { sisaTagihanAwal: number, sisaTagihan: number }>()

    for (const d of details) {
      const sisaAwal = currentBalance
      const totalPengurang = d.jumlahDibayar + (d.potongan || 0)
      const sisaAkhir = Math.max(0, sisaAwal - totalPengurang)
      detailBalanceMap.set(d.id, {
        sisaTagihanAwal: sisaAwal,
        sisaTagihan: sisaAkhir
      })
      currentBalance = sisaAkhir
    }

    // Map ke format terstruktur dengan nomor termin
    const mapped = details.map((d, index) => {
      const tx = d.transaksi
      const items = tx.pembayaranTagihan.map(ptd => {
        const historicalBalance = detailBalanceMap.get(ptd.id)
        return {
          namaAkun: ptd.tagihan.namaTagihan || ptd.tagihan.akun.nama,
          jumlahBayar: ptd.jumlahDibayar,
          sisaTagihanAwal: historicalBalance ? historicalBalance.sisaTagihanAwal : (ptd.tagihan.sisaTagihan + ptd.jumlahDibayar + (ptd.potongan || 0)),
          potongan: ptd.potongan || 0,
          kategoriPotongan: ptd.kategoriPotongan,
          sisaTagihan: historicalBalance ? historicalBalance.sisaTagihan : ptd.tagihan.sisaTagihan
        }
      })

      return {
        transaksiId: tx.id,
        noReferensi: tx.noReferensi,
        tanggal: tx.tanggal,
        muridName: tx.namaPihakKetiga || tagihan?.murid?.name || "Unknown",
        terminKe: index + 1,
        items,
        total: tx.totalNilai,
        createdAt: tx.createdAt
      }
    })

    // Deduplikasi berdasarkan transaksiId
    const uniqueMap = new Map<string, any>()
    mapped.forEach(m => {
      if (!uniqueMap.has(m.transaksiId)) {
        uniqueMap.set(m.transaksiId, m)
      }
    })

    // Kembalikan terurut terbaru (descending)
    return Array.from(uniqueMap.values()).reverse()
  } catch (error: any) {
    console.error("Error getRiwayatTransaksiByTagihan:", error)
    return []
  }
}

/**
 * Server action untuk menyinkronkan dan memperbarui deskripsi transaksi tagihan lama
 * yang masih berformat generik "Pembayaran Tagihan Siswa: [Nama]" menjadi deskripsi spesifik
 * pos pembayaran (misal: SPP, BAT, PSB, PTS/PAT).
 */
export async function sinkronkanDeskripsiTagihanLama(unitSekolahId?: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA", "SUPERADMIN", "YAYASAN"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  try {
    const isGlobal = !unitSekolahId || unitSekolahId === "all"
    const whereClause: any = {
      jenis: "KAS_MASUK",
      sumber: "TAGIHAN",
      OR: [
        { deskripsi: { startsWith: "Pembayaran Tagihan Siswa:" } },
        { deskripsi: "Pembayaran Tagihan Siswa" }
      ]
    }

    if (!isGlobal) {
      whereClause.unitSekolahId = unitSekolahId
    }

    const transaksiList = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        pembayaranTagihan: {
          include: {
            tagihan: {
              select: { 
                namaTagihan: true, 
                akunId: true,
                akun: { select: { nama: true } } 
              }
            }
          }
        },
        detail: {
          select: { id: true, akunId: true, posisi: true, deskripsi: true }
        }
      },
      take: 500 // Batch hingga 500 transaksi
    })

    let updatedCount = 0

    for (const tx of transaksiList) {
      if (!tx.pembayaranTagihan || tx.pembayaranTagihan.length === 0) continue

      const itemsDesc = tx.pembayaranTagihan.map(pt => ({
        namaAkun: pt.tagihan.namaTagihan || pt.tagihan.akun.nama,
        jumlahBayar: pt.jumlahDibayar,
        potongan: pt.potongan || 0
      }))

      const muridName = tx.namaPihakKetiga || ""
      const newDeskripsi = buildDeskripsiPembayaranTagihan(itemsDesc, muridName)

      if (newDeskripsi && newDeskripsi !== tx.deskripsi) {
        await prisma.transaksi.update({
          where: { id: tx.id },
          data: { deskripsi: newDeskripsi }
        })

        // Perbarui detail transaksi kas masuk (posisi DEBIT & KREDIT)
        for (const td of tx.detail) {
          if (td.posisi === "DEBIT") {
            await prisma.transaksiDetail.update({
              where: { id: td.id },
              data: { deskripsi: newDeskripsi }
            })
          } else if (td.posisi === "KREDIT") {
            const matchedPt = tx.pembayaranTagihan.find(pt => pt.tagihan.akunId === td.akunId)
            if (matchedPt) {
              const itemNama = matchedPt.tagihan.namaTagihan || matchedPt.tagihan.akun.nama
              await prisma.transaksiDetail.update({
                where: { id: td.id },
                data: { deskripsi: `Pembayaran ${itemNama} - Siswa: ${muridName}` }
              })
            }
          }
        }

        updatedCount++
      }
    }

    revalidatePath("/(dashboard)/(keuangan)/kas-masuk")
    revalidatePath("/(dashboard)/(keuangan)/pembayaran-tagihan")
    return { success: true, count: updatedCount }
  } catch (error: any) {
    console.error("Error sinkronkanDeskripsiTagihanLama:", error)
    return { success: false, error: error.message }
  }
}
