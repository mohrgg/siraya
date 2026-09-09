"use server"

import prisma from "@/lib/prisma"
import { revalidatePath, unstable_noStore } from "next/cache"

import { auth } from "@/lib/auth"

export async function getAkunKasBankList(unitSekolahId?: string) {
  unstable_noStore()
  try {
    const data = await prisma.akunDetail.findMany({
      where: {
        isKasBank: true,
        isActive: true,
        unitSekolahId: unitSekolahId
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
            subKelasId: filters.subKelasId
          }
        }
      }
    } else {
      whereClause.riwayatKelas = {
        some: {
          tahunAkademikId: filters.tahunAkademikId,
          ...(filters.subKelasId ? { subKelasId: filters.subKelasId } : {}),
          ...(filters.kelasId && !filters.subKelasId ? { subKelas: { tingkatId: filters.kelasId } } : {})
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
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            subKelas: {
              select: {
                id: true,
                name: true
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

async function getOrCreateAkunPotongan(tx: any, unitSekolahId: string) {
  // 1. Cari apakah sudah ada akun Beban Potongan/Beasiswa di unit ini
  const existing = await tx.akunDetail.findFirst({
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
  let klasifikasiBeban = await tx.klasifikasiAkun.findFirst({
    where: {
      kode: "5",
      unitSekolahId
    }
  })

  if (!klasifikasiBeban) {
    klasifikasiBeban = await tx.klasifikasiAkun.create({
      data: {
        kode: "5",
        nama: "BEBAN (BIAYA)",
        unitSekolahId
      }
    })
  }

  // 3. Pastikan SubKlasifikasi '51' (Beban Operasional / Beban) ada
  let subBeban = await tx.subKlasifikasiAkun.findFirst({
    where: {
      kode: "51",
      unitSekolahId
    }
  })

  if (!subBeban) {
    subBeban = await tx.subKlasifikasiAkun.findFirst({
      where: {
        klasifikasiAkunId: klasifikasiBeban.id,
        unitSekolahId
      }
    })
  }

  if (!subBeban) {
    subBeban = await tx.subKlasifikasiAkun.create({
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
  const kodeUsed = await tx.akunDetail.findUnique({
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

  return await tx.akunDetail.create({
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

    const result = await prisma.$transaction(async (tx) => {
      let finalNoReferensi = data.noReferensi;
      if (!finalNoReferensi) {
        const latestTx = await tx.transaksi.findFirst({
          where: { 
            jenis: 'KAS_MASUK',
            tanggal: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
          },
          orderBy: { noReferensi: 'desc' },
          select: { noReferensi: true }
        });
        
        let nextSeq = 1;
        if (latestTx?.noReferensi) {
          const match = latestTx.noReferensi.match(/-(\d+)$/);
          if (match) {
            nextSeq = parseInt(match[1]) + 1;
          }
        }
        
        const dateStr = [
          String(new Date().getDate()).padStart(2, '0'),
          String(new Date().getMonth() + 1).padStart(2, '0'),
          String(new Date().getFullYear()).slice(-2)
        ].join('');
        
        finalNoReferensi = `KM-${dateStr}-${String(nextSeq).padStart(4, '0')}`;
      }

      const transaksi = await tx.transaksi.create({
        data: {
          noReferensi: finalNoReferensi,
          tanggal: data.tanggal,
          jenis: "KAS_MASUK",
          sumber: "TAGIHAN",
          deskripsi: data.deskripsi || `Pembayaran Tagihan Siswa: ${data.muridName}`,
          totalNilai: totalBayar,
          status: "POSTED",
          namaPihakKetiga: data.muridName,
          unitSekolahId: data.unitSekolahId,
          pembuatId: data.pembuatId
        }
      })

      // 1. DEBIT Kas/Bank jika ada uang tunai yang diterima
      if (totalBayar > 0) {
        await tx.transaksiDetail.create({
          data: {
            transaksiId: transaksi.id,
            akunId: data.akunKasId,
            posisi: "DEBIT",
            nilai: totalBayar,
            deskripsi: `Pembayaran Tagihan Siswa: ${data.muridName}`
          }
        })
      }

      // 2. DEBIT Beban Potongan/Beasiswa jika ada potongan yang diberikan
      if (totalPotongan > 0) {
        let targetUnitId: string | undefined = data.unitSekolahId || transaksi.unitSekolahId || undefined;
        if (!targetUnitId && data.items.length > 0) {
          const t = await tx.tagihan.findUnique({
            where: { id: data.items[0].tagihanId },
            include: { murid: true }
          });
          targetUnitId = t?.murid?.unitSekolahId || undefined;
        }

        if (targetUnitId) {
          const akunBebanPotongan = await getOrCreateAkunPotongan(tx, targetUnitId);
          await tx.transaksiDetail.create({
            data: {
              transaksiId: transaksi.id,
              akunId: akunBebanPotongan.id,
              posisi: "DEBIT",
              nilai: totalPotongan,
              deskripsi: `Potongan/Beasiswa Tagihan Siswa: ${data.muridName}`
            }
          })
        }
      }

      // 3. KREDIT Pendapatan Bruto per item tagihan (Jumlah Bayar + Potongan)
      for (const item of data.items) {
        const totalNilaiItem = item.jumlahBayar + (item.potongan || 0);
        if (totalNilaiItem <= 0) continue;

        await tx.transaksiDetail.create({
          data: {
            transaksiId: transaksi.id,
            akunId: item.akunPendapatanId,
            posisi: "KREDIT",
            nilai: totalNilaiItem,
            deskripsi: `Pembayaran Tagihan Siswa: ${data.muridName}`
          }
        })
      }

      for (const item of data.items) {
        const currentTagihan = await tx.tagihan.findUnique({ where: { id: item.tagihanId } })
        if (!currentTagihan) throw new Error(`Tagihan tidak ditemukan: ${item.tagihanId}`)
        
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
    })

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
    return { success: false, message: error.message || "Gagal memproses pembayaran" }
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
