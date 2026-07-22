import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function logAktivitas(aksi: string, modul: string, keterangan: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.warn("Log Aktivitas Gagal: Tidak ada user session")
      return
    }

    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id,
        aksi,
        modul,
        keterangan,
      }
    })
  } catch (error) {
    console.error("Gagal mencatat log aktivitas:", error)
  }
}
