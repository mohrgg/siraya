"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Ambil data pengaturan
export async function getPengaturan() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  // Karena hanya ada 1 record, kita gunakan findFirst atau default ID
  let settings = await prisma.pengaturan.findUnique({
    where: { id: "GLOBAL" }
  })

  // Jika belum ada di database, kembalikan nilai default kosong
  if (!settings) {
    settings = {
      id: "GLOBAL",
      namaYayasan: "",
      alamat: "",
      telepon: "",
      email: "",
      website: "",
      logoUrl: "",
      namaKepalaTU: "",
      namaBendahara: "",
      catatanKwitansi: "",
      rekeningBank: "[]",
      prefixKasMasuk: "KM",
      prefixKasKeluar: "KK",
      updatedAt: new Date()
    } as any
  }

  return settings
}

// Simpan data pengaturan
export async function upsertPengaturan(data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  if (session.user.role !== "ADMIN") {
    throw new Error("Hanya Admin yang dapat mengubah pengaturan yayasan")
  }

  try {
    const settings = await prisma.pengaturan.upsert({
      where: { id: "GLOBAL" },
      update: {
        namaYayasan: data.namaYayasan,
        alamat: data.alamat,
        telepon: data.telepon,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        namaKepalaTU: data.namaKepalaTU,
        namaBendahara: data.namaBendahara,
        catatanKwitansi: data.catatanKwitansi,
        rekeningBank: data.rekeningBank, // JSON string
        prefixKasMasuk: data.prefixKasMasuk || "KM",
        prefixKasKeluar: data.prefixKasKeluar || "KK"
      },
      create: {
        id: "GLOBAL",
        namaYayasan: data.namaYayasan,
        alamat: data.alamat,
        telepon: data.telepon,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        namaKepalaTU: data.namaKepalaTU,
        namaBendahara: data.namaBendahara,
        catatanKwitansi: data.catatanKwitansi,
        rekeningBank: data.rekeningBank, // JSON string
        prefixKasMasuk: data.prefixKasMasuk || "KM",
        prefixKasKeluar: data.prefixKasKeluar || "KK"
      }
    })
    
    // Log aktivitas
    await prisma.logAktivitas.create({
      data: {
        penggunaId: session.user.id as string,
        aksi: "UPDATE_PENGATURAN",
        modul: "PENGATURAN",
        keterangan: "Memperbarui data pengaturan yayasan dan profil"
      }
    })

    revalidatePath("/pengaturan")
    return { success: true, data: settings }
  } catch (error: any) {
    console.error("Gagal menyimpan pengaturan:", error)
    return { success: false, error: error.message || "Gagal menyimpan pengaturan" }
  }
}

// Ambil list unit sekolah untuk tab kop surat
export async function getUnitSekolahList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  return prisma.unitSekolah.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
}

// Simpan kop surat spesifik per unit
export async function updateUnitSekolahKop(id: string, data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "ADMIN") {
    throw new Error("Hanya Admin yang dapat mengubah pengaturan unit")
  }

  try {
    const updated = await prisma.unitSekolah.update({
      where: { id },
      data: {
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        namaKepalaSekolah: data.namaKepalaSekolah,
        nipKepalaSekolah: data.nipKepalaSekolah,
        // logo: data.logo // if handling image later
      }
    })
    revalidatePath("/pengaturan")
    return { success: true, data: updated }
  } catch (error: any) {
    console.error("Gagal update unit sekolah kop:", error)
    return { success: false, error: error.message || "Gagal update kop surat unit" }
  }
}
