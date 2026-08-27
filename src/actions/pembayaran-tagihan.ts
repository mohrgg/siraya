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
  subKelasId?: string 
}) {
  unstable_noStore()
  try {
    const whereClause: any = {
      unitSekolahId: filters.unitSekolahId,
      status: "AKTIF",
      riwayatKelas: {
        some: {
          tahunAkademikId: filters.tahunAkademikId,
          ...(filters.subKelasId ? { subKelasId: filters.subKelasId } : {}),
          ...(filters.kelasId && !filters.subKelasId ? { subKelas: { kelasId: filters.kelasId } } : {})
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

export async function prosesPembayaranTagihan(data: {
  muridId: string,
  muridName: string,
  unitSekolahId: string,
  pembuatId: string,
  akunKasId: string,
  tanggal: Date,
  noReferensi?: string,
  deskripsi: string,
  items: { tagihanId: string, jumlahBayar: number, akunPendapatanId: string }[]
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "TATA_USAHA"].includes((session.user as any).role)) {
    throw new Error("Akses ditolak.")
  }

  try {
    const totalBayar = data.items.reduce((sum, item) => sum + item.jumlahBayar, 0)
    if (totalBayar <= 0) {
      throw new Error("Total pembayaran harus lebih dari 0")
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalNoReferensi = data.noReferensi;
      if (!finalNoReferensi) {
        // Generate auto no referensi for Kas Masuk
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

      // 1. Create Transaksi (KAS_MASUK)
      const transaksi = await tx.transaksi.create({
        data: {
          noReferensi: finalNoReferensi,
          tanggal: data.tanggal,
          jenis: "KAS_MASUK",
          sumber: "TAGIHAN",
          deskripsi: data.deskripsi || `Pembayaran Tagihan Siswa: ${data.muridName}`,
          totalNilai: totalBayar,
          status: "POSTED",
          namaPihakKetiga: data.muridName, // set penyetor as murid
          unitSekolahId: data.unitSekolahId,
          pembuatId: data.pembuatId
        }
      })

      // 2. Create Transaksi Detail (Debit Kas, Kredit Pendapatan)
      // Debit: Kas/Bank
      await tx.transaksiDetail.create({
        data: {
          transaksiId: transaksi.id,
          akunId: data.akunKasId,
          posisi: "DEBIT",
          nilai: totalBayar,
          deskripsi: `Penerimaan Pembayaran Tagihan: ${data.muridName}`
        }
      })

      // Kredit: Akun Pendapatan
      // We aggregate by akunPendapatanId in case multiple items go to the same akun
      const creditAgg: Record<string, number> = {}
      data.items.forEach(item => {
        creditAgg[item.akunPendapatanId] = (creditAgg[item.akunPendapatanId] || 0) + item.jumlahBayar
      })

      for (const [akunId, nilai] of Object.entries(creditAgg)) {
        await tx.transaksiDetail.create({
          data: {
            transaksiId: transaksi.id,
            akunId: akunId,
            posisi: "KREDIT",
            nilai: nilai,
            deskripsi: `Pendapatan Tagihan: ${data.muridName}`
          }
        })
      }

      // 3. Update Tagihan & Create PembayaranTagihanDetail
      for (const item of data.items) {
        // fetch current tagihan to ensure valid sisa
        const currentTagihan = await tx.tagihan.findUnique({ where: { id: item.tagihanId } })
        if (!currentTagihan) throw new Error(`Tagihan tidak ditemukan: ${item.tagihanId}`)
        
        if (item.jumlahBayar > currentTagihan.sisaTagihan) {
          throw new Error("Jumlah pembayaran melebihi sisa tagihan")
        }

        const newSisa = currentTagihan.sisaTagihan - item.jumlahBayar
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
            jumlahDibayar: item.jumlahBayar
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
      orderBy: { createdAt: "desc" }
    })

    // Map this to a structured format for UI
    const mapped = details.map(d => {
      const tx = d.transaksi
      // The items in the transaction:
      const items = tx.pembayaranTagihan.map(ptd => ({
        namaAkun: ptd.tagihan.namaTagihan || ptd.tagihan.akun.nama,
        jumlahBayar: ptd.jumlahDibayar,
        sisaTagihan: ptd.tagihan.sisaTagihan
      }))

      return {
        transaksiId: tx.id,
        noReferensi: tx.noReferensi,
        tanggal: tx.tanggal,
        muridName: tx.namaPihakKetiga || "Unknown",
        items,
        total: tx.totalNilai
      }
    })

    // Because a single transaction might have multiple PembayaranTagihanDetail records (e.g. paying 2 months of SPP in 1 transaction),
    // and both records are returned if the query was for tagihanId, we should deduplicate by transaksiId
    const uniqueMap = new Map<string, any>()
    mapped.forEach(m => {
      if (!uniqueMap.has(m.transaksiId)) {
        uniqueMap.set(m.transaksiId, m)
      }
    })

    return Array.from(uniqueMap.values())
  } catch (error: any) {
    console.error("Error getRiwayatTransaksiByTagihan:", error)
    return []
  }
}
