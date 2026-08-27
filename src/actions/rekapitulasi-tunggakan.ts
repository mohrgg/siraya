"use server"

import prisma from "@/lib/prisma"
import { unstable_noStore } from "next/cache"

export async function getRekapitulasiTunggakan(unitSekolahId: string, tahunAkademikId: string) {
  unstable_noStore();
  try {
    // 1. Get all SubKelas in the given unit
    const subKelasList = await prisma.subKelas.findMany({
      where: { unitSekolahId },
      select: {
        id: true,
        name: true,
        riwayatKelas: {
          where: { tahunAkademikId, isCurrent: true },
          select: {
            muridId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // 2. Get all tagihan for those students in the active academic year
    const tagihanList = await prisma.tagihan.findMany({
      where: {
        tahunAkademikId,
        murid: {
          unitSekolahId
        }
      },
      select: {
        muridId: true,
        murid: {
          select: {
            id: true,
            name: true,
            nisn: true
          }
        },
        akunId: true,
        jumlah: true,
        sisaTagihan: true,
        akun: {
          select: {
            id: true,
            nama: true,
            kode: true
          }
        }
      }
    });

    const akunMap = new Map<string, { id: string, nama: string, kode: string }>();

    // Process data to map each murid to their subKelas
    const muridToSubKelas = new Map<string, string>();
    subKelasList.forEach(sk => {
      sk.riwayatKelas.forEach(rk => {
        muridToSubKelas.set(rk.muridId, sk.id);
      });
    });

    // Grouping
    const rekap = subKelasList.map(sk => ({
      subKelasId: sk.id,
      subKelasName: sk.name,
      totalTagihan: 0,
      totalDibayar: 0,
      totalTunggakan: 0,
      detailKomponen: {} as Record<string, { tagihan: number, dibayar: number, tunggakan: number }>,
      students: {} as Record<string, {
        id: string,
        name: string,
        nisn: string,
        totalTagihan: number,
        totalDibayar: number,
        totalTunggakan: number,
        detailKomponen: Record<string, { tagihan: number, dibayar: number, tunggakan: number }>
      }>
    }));

    const rekapMap = new Map(rekap.map(r => [r.subKelasId, r]));

    tagihanList.forEach(t => {
      const subKelasId = muridToSubKelas.get(t.muridId);
      if (!subKelasId) return; // Murid doesn't have an active class in this year

      const r = rekapMap.get(subKelasId);
      if (r) {
        if (!akunMap.has(t.akunId)) {
          akunMap.set(t.akunId, t.akun);
        }

        const dibayar = t.jumlah - Math.max(0, t.sisaTagihan);
        const tunggakan = Math.max(0, t.sisaTagihan);

        r.totalTagihan += t.jumlah;
        r.totalDibayar += dibayar;
        r.totalTunggakan += tunggakan;

        if (!r.detailKomponen[t.akunId]) {
          r.detailKomponen[t.akunId] = { tagihan: 0, dibayar: 0, tunggakan: 0 };
        }
        r.detailKomponen[t.akunId].tagihan += t.jumlah;
        r.detailKomponen[t.akunId].dibayar += dibayar;
        r.detailKomponen[t.akunId].tunggakan += tunggakan;

        // Populate student detail
        if (!r.students[t.muridId]) {
          r.students[t.muridId] = {
            id: t.muridId,
            name: t.murid.name,
            nisn: t.murid.nisn || "-",
            totalTagihan: 0,
            totalDibayar: 0,
            totalTunggakan: 0,
            detailKomponen: {}
          };
        }
        
        const s = r.students[t.muridId];
        s.totalTagihan += t.jumlah;
        s.totalDibayar += dibayar;
        s.totalTunggakan += tunggakan;
        
        if (!s.detailKomponen[t.akunId]) {
          s.detailKomponen[t.akunId] = { tagihan: 0, dibayar: 0, tunggakan: 0 };
        }
        s.detailKomponen[t.akunId].tagihan += t.jumlah;
        s.detailKomponen[t.akunId].dibayar += dibayar;
        s.detailKomponen[t.akunId].tunggakan += tunggakan;
      }
    });

    const finalRekap = rekap.map(r => {
      const { students, ...rest } = r;
      return {
        ...rest,
        studentsList: Object.values(students).sort((a, b) => a.name.localeCompare(b.name))
      }
    })

    return {
      success: true,
      data: finalRekap,
      akunList: Array.from(akunMap.values()).sort((a, b) => a.kode.localeCompare(b.kode))
    };

  } catch (error: any) {
    console.error("Error getRekapitulasiTunggakan:", error);
    return {
      success: false,
      message: error.message
    }
  }
}
