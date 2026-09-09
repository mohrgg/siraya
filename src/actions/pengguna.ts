"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { logAktivitas } from "@/lib/logger"

// Guard: Only ADMIN can access
const requireAdmin = async () => {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Akses ditolak. Hanya Administrator yang diizinkan.")
  }
}

export async function getPengguna() {
  await requireAdmin()
  const data = await prisma.pengguna.findMany({
    include: {
      unitSekolah: { select: { name: true } },
      divisi: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Jangan kembalikan password
  return data.map(({ password, ...user }) => user)
}

export async function tambahPengguna(data: {
  name: string, email: string, role: string,
  unitSekolahId?: string, divisiId?: string, password?: string
}) {
  await requireAdmin()
  
  const existingEmail = await prisma.pengguna.findUnique({ where: { email: data.email } })
  if (existingEmail) throw new Error("Email sudah terdaftar.")

  if (data.role !== "ADMIN" && data.role !== "YAYASAN" && !data.unitSekolahId) {
    throw new Error("Unit Sekolah wajib diisi untuk role selain ADMIN dan YAYASAN.")
  }

  // Default password is 'albas123' if not provided
  const hashedPassword = await bcrypt.hash(data.password || "albas123", 10)

  const user = await prisma.pengguna.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      unitSekolahId: data.unitSekolahId || null,
      divisiId: data.divisiId || null,
      password: hashedPassword
    }
  })

  await logAktivitas("TAMBAH_PENGGUNA", "MANAJEMEN_USER", `Menambahkan akun baru: ${data.email} (${data.role})`)

  revalidatePath("/manajemen-user")
  return { id: user.id }
}

export async function editPengguna(id: string, data: {
  name: string, email: string, role: string,
  unitSekolahId?: string, divisiId?: string, isActive: boolean, password?: string
}) {
  await requireAdmin()

  const existingEmail = await prisma.pengguna.findFirst({ 
    where: { email: data.email, id: { not: id } } 
  })
  if (existingEmail) throw new Error("Email sudah digunakan pengguna lain.")

  if (data.role !== "ADMIN" && data.role !== "YAYASAN" && !data.unitSekolahId) {
    throw new Error("Unit Sekolah wajib diisi untuk role selain ADMIN dan YAYASAN.")
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    unitSekolahId: data.unitSekolahId || null,
    divisiId: data.divisiId || null,
    isActive: data.isActive
  }

  if (data.password && data.password.trim() !== "") {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  await prisma.pengguna.update({
    where: { id },
    data: updateData
  })

  await logAktivitas("EDIT_PENGGUNA", "MANAJEMEN_USER", `Mengubah data akun: ${data.email} (Status: ${data.isActive ? "Aktif" : "Nonaktif"})`)

  revalidatePath("/manajemen-user")
}

export async function resetPasswordPengguna(id: string) {
  await requireAdmin()
  const hashedPassword = await bcrypt.hash("albas123", 10)
  
  await prisma.pengguna.update({
    where: { id },
    data: { password: hashedPassword }
  })
  
  await logAktivitas("RESET_PASSWORD", "MANAJEMEN_USER", `Mereset password akun dengan ID: ${id}`)
}

export async function gantiPasswordMandiri(oldPassword: string, newPassword: string) {
  const session = await auth()
  if (!session || !session.user.id) {
    throw new Error("Sesi tidak valid, harap login kembali.")
  }

  const user = await prisma.pengguna.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.")
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password)
  if (!isMatch) {
    throw new Error("Password lama salah.")
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.pengguna.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  await logAktivitas("GANTI_PASSWORD_MANDIRI", "PROFIL", `Pengguna mengganti passwordnya sendiri`)
}

export async function nonaktifkanPengguna(id: string) {
  await requireAdmin()
  
  const user = await prisma.pengguna.findUnique({ where: { id } })
  if (!user) throw new Error("Pengguna tidak ditemukan")
  if (user.role === "ADMIN") {
    // Check if there's only one admin left
    const adminCount = await prisma.pengguna.count({ where: { role: "ADMIN", isActive: true } })
    if (adminCount <= 1) throw new Error("Tidak dapat menonaktifkan Superadmin terakhir!")
  }

  await prisma.pengguna.update({
    where: { id },
    data: { isActive: false }
  })
  
  await logAktivitas("NONAKTIF_PENGGUNA", "MANAJEMEN_USER", `Menonaktifkan akun (Soft Delete): ${user.email}`)
  revalidatePath("/manajemen-user")
}

export async function aktifkanPengguna(id: string) {
  await requireAdmin()
  
  const user = await prisma.pengguna.findUnique({ where: { id } })
  if (!user) throw new Error("Pengguna tidak ditemukan")

  await prisma.pengguna.update({
    where: { id },
    data: { isActive: true }
  })
  
  await logAktivitas("AKTIFKAN_PENGGUNA", "MANAJEMEN_USER", `Mengaktifkan kembali akun: ${user.email}`)
  revalidatePath("/manajemen-user")
}

// ========== DIVISI ==========

export async function getDivisi() {
  await requireAdmin()
  return await prisma.divisi.findMany({ orderBy: { name: "asc" } })
}

export async function tambahDivisi(data: { name: string, description?: string }) {
  await requireAdmin()
  await prisma.divisi.create({ 
    data: {
      name: data.name,
      description: data.description || null
    }
  })
  await logAktivitas("TAMBAH_DIVISI", "MANAJEMEN_USER", `Menambahkan divisi baru: ${data.name}`)
  revalidatePath("/manajemen-user")
}

export async function editDivisi(id: string, data: { name: string, description?: string }) {
  await requireAdmin()
  await prisma.divisi.update({ 
    where: { id }, 
    data: {
      name: data.name,
      description: data.description || null
    }
  })
  await logAktivitas("EDIT_DIVISI", "MANAJEMEN_USER", `Mengubah divisi: ${data.name}`)
  revalidatePath("/manajemen-user")
}

export async function hapusDivisi(id: string) {
  await requireAdmin()
  const inUse = await prisma.pengguna.findFirst({ where: { divisiId: id } })
  if (inUse) throw new Error("Divisi tidak bisa dihapus karena sedang digunakan oleh pengguna.")
  
  const div = await prisma.divisi.findUnique({ where: { id } })
  await prisma.divisi.delete({ where: { id } })
  await logAktivitas("HAPUS_DIVISI", "MANAJEMEN_USER", `Menghapus divisi: ${div?.name}`)
  revalidatePath("/manajemen-user")
}
