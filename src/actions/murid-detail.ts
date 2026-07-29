"use server"

import prisma from "@/lib/prisma"

export async function getMuridDetail360(id: string) {
  try {
    const murid = await prisma.murid.findUnique({
      where: { id },
      include: {
        unitSekolah: true,
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

    const serializedMurid = {
      ...murid,
    }

    return { success: true, data: serializedMurid }
  } catch (error: any) {
    console.error("Error fetching 360 student profile:", error)
    return { success: false, error: error.message || "Gagal mengambil data profil siswa" }
  }
}
