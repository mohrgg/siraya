"use server"

import prisma from "@/lib/prisma"

export async function getMuridDetail360(id: string) {
  try {
    const murid = await prisma.murid.findUnique({
      where: { id },
      include: {
        unitSekolah: true,
        tagihan: {
          include: {
            akun: true,
            tahunAkademik: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        riwayatKelas: {
          include: {
            subKelas: {
              include: {
                tingkat: true,
                jurusan: true,
                tahunAkademik: true,
              }
            },
            tahunAkademik: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!murid) {
      return { success: false, error: "Data murid tidak ditemukan" }
    }

    let totalTagihan = 0;
    let sisaTunggakan = 0;

    if (murid.tagihan) {
      murid.tagihan.forEach((t: any) => {
        totalTagihan += t.jumlah || 0;
        sisaTunggakan += t.sisaTagihan || 0;
      });
    }

    const totalTerbayar = totalTagihan - sisaTunggakan;

    const summaryKeuangan = {
      totalTagihan,
      sisaTunggakan,
      totalTerbayar
    };

    const serializedMurid = {
      ...murid,
      summaryKeuangan
    }

    return { success: true, data: serializedMurid }
  } catch (error: any) {
    console.error("Error fetching 360 student profile:", error)
    return { success: false, error: error.message || "Gagal mengambil data profil siswa" }
  }
}
