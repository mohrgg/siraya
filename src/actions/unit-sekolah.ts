"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { sortSchoolClasses } from "@/lib/dashboard-queries"
import { logAktivitas } from "@/lib/logger"

export async function getUnitSekolah() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const [units, tagihanRaw, transaksiRaw] = await Promise.all([
    prisma.unitSekolah.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            murid: { where: { isActive: true, isDeleted: false } },
            subKelas: { where: { isDeleted: false } },
            guru: { where: { isActive: true, isDeleted: false } },
            jurusan: { where: { isDeleted: false } },
          }
        },
        tingkat: {
          select: {
            name: true,
            subKelas: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    riwayatKelas: {
                      where: { isCurrent: true, murid: { isActive: true, isDeleted: false } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.tagihan.findMany({
      select: {
        jumlah: true,
        sisaTagihan: true,
        murid: { select: { unitSekolahId: true } }
      }
    }),
    prisma.transaksi.findMany({
      where: {
        status: "POSTED",
        unitSekolahId: { not: null }
      },
      select: {
        jenis: true,
        totalNilai: true,
        unitSekolahId: true
      }
    })
  ])

  // Map Tagihan per unit
  const tagihanMap = new Map<string, { total: number; terbayar: number }>()
  tagihanRaw.forEach(t => {
    const unitId = t.murid?.unitSekolahId
    if (unitId) {
      const curr = tagihanMap.get(unitId) || { total: 0, terbayar: 0 }
      curr.total += t.jumlah
      curr.terbayar += (t.jumlah - t.sisaTagihan)
      tagihanMap.set(unitId, curr)
    }
  })

  // Map Transaksi per unit
  const transaksiMap = new Map<string, { masuk: number; keluar: number }>()
  transaksiRaw.forEach(t => {
    if (t.unitSekolahId) {
      const curr = transaksiMap.get(t.unitSekolahId) || { masuk: 0, keluar: 0 }
      if (t.jenis === "KAS_MASUK") {
        curr.masuk += t.totalNilai
      } else if (t.jenis === "KAS_KELUAR") {
        curr.keluar += t.totalNilai
      }
      transaksiMap.set(t.unitSekolahId, curr)
    }
  })

  // Urutan hierarki level sekolah
  const levelOrder: Record<string, number> = {
    'TK': 1,
    'SD': 2,
    'SMP': 3,
    'MTS': 3,
    'SMA': 4,
    'SMK': 5,
    'MA': 5,
  }

  const enrichedUnits = units.map(u => {
    const tData = tagihanMap.get(u.id) || { total: 0, terbayar: 0 }
    const tagihanTotal = tData.total
    const tagihanTerbayar = tData.terbayar
    const tagihanSisa = tagihanTotal - tagihanTerbayar
    const kolektibilitas = tagihanTotal > 0 ? Math.round((tagihanTerbayar / tagihanTotal) * 100) : null

    const txData = transaksiMap.get(u.id) || { masuk: 0, keluar: 0 }
    const kasMasuk = txData.masuk
    const kasKeluar = txData.keluar
    const saldoKas = kasMasuk - kasKeluar

    const classes = (u.tingkat || []).map(t => ({
      name: t.name,
      total: t.subKelas.reduce((sum, sk) => sum + sk._count.riwayatKelas, 0),
      rombelList: t.subKelas.map(sk => ({
        id: sk.id,
        name: sk.name,
        total: sk._count.riwayatKelas
      }))
    })).filter(t => t.total > 0).sort((a, b) => sortSchoolClasses(a.name, b.name))

    return {
      ...u,
      tagihanTotal,
      tagihanTerbayar,
      tagihanSisa,
      kolektibilitas,
      kasMasuk,
      kasKeluar,
      saldoKas,
      classes
    }
  })

  return enrichedUnits.sort((a, b) => {
    const levelA = levelOrder[a.level?.toUpperCase()] || 99
    const levelB = levelOrder[b.level?.toUpperCase()] || 99
    
    if (levelA !== levelB) {
      return levelA - levelB
    }
    
    return a.name.localeCompare(b.name)
  })
}

export async function tambahUnitSekolah(data: { name: string, level: string, address?: string, phone?: string }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.create({ 
    data,
    include: {
      _count: {
        select: {
          murid: { where: { isActive: true, isDeleted: false } },
          subKelas: { where: { isDeleted: false } },
          guru: { where: { isActive: true, isDeleted: false } },
          jurusan: { where: { isDeleted: false } },
        }
      }
    }
  })

  await logAktivitas("TAMBAH_UNIT", "PENGATURAN_UNIT", `Menambahkan unit sekolah: ${result.name} (Jenjang: ${result.level})`)

  revalidatePath("/(dashboard)/(data-yayasan)/unit-sekolah", "page")
  revalidatePath("/data-master")
  revalidatePath("/") // revalidate dashboard
  return result
}

export async function editUnitSekolah(id: string, data: { name?: string, level?: string, address?: string, phone?: string, email?: string, website?: string, namaKepalaSekolah?: string, nipKepalaSekolah?: string, kotaPenandatangan?: string, isActive?: boolean }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          murid: { where: { isActive: true, isDeleted: false } },
          subKelas: { where: { isDeleted: false } },
          guru: { where: { isActive: true, isDeleted: false } },
          jurusan: { where: { isDeleted: false } },
        }
      }
    }
  })

  const ksInfo = result.namaKepalaSekolah ? ` - Kepsek: ${result.namaKepalaSekolah}` : ""
  await logAktivitas("EDIT_UNIT", "PENGATURAN_UNIT", `Mengubah unit sekolah: ${result.name} (Jenjang: ${result.level})${ksInfo}`)

  revalidatePath("/(dashboard)/(data-yayasan)/unit-sekolah", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}

export async function hapusUnitSekolah(id: string) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") throw new Error("Akses ditolak. Hanya Super Admin yang diizinkan.")

  const result = await prisma.unitSekolah.delete({
    where: { id }
  })

  await logAktivitas("HAPUS_UNIT", "PENGATURAN_UNIT", `Menghapus unit sekolah: ${result.name} (ID: ${id})`)

  revalidatePath("/(dashboard)/(data-yayasan)/unit-sekolah", "page")
  revalidatePath("/data-master")
  revalidatePath("/")
  return result
}
