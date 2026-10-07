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
    where: {
      role: { not: "SYSTEM" }
    },
    include: {
      unitSekolah: { select: { name: true } },
      divisi: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  // Jangan kembalikan password
  return data.map(({ password, ...user }) => user)
}

// Helper validasi kekuatan kata sandi
export async function validatePasswordStrength(password: string): Promise<{ valid: boolean; message?: string }> {
  if (!password || password.length < 8) {
    return { valid: false, message: "Kata sandi minimal 8 karakter." }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Kata sandi harus mengandung minimal 1 huruf besar (kapital)." }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Kata sandi harus mengandung minimal 1 huruf kecil." }
  }
  if (!/[0-9]/.test(password) && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Kata sandi harus mengandung minimal 1 angka atau simbol khusus." }
  }
  return { valid: true }
}

export async function tambahPengguna(data: {
  name: string, email: string, role: string,
  unitSekolahId?: string, divisiId?: string, password?: string,
  mustChangePassword?: boolean
}) {
  await requireAdmin()
  
  const existingEmail = await prisma.pengguna.findUnique({ where: { email: data.email } })
  if (existingEmail) throw new Error("Email sudah terdaftar.")

  if (data.role !== "ADMIN" && data.role !== "YAYASAN" && !data.unitSekolahId) {
    throw new Error("Unit Sekolah wajib diisi untuk role selain ADMIN dan YAYASAN.")
  }

  // Jika password kustom diisi dan bukan default "albas123", validasi kekuatannya
  if (data.password && data.password !== "albas123") {
    const check = await validatePasswordStrength(data.password)
    if (!check.valid) throw new Error(check.message)
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
      password: hashedPassword,
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true
    }
  })

  await logAktivitas("TAMBAH_PENGGUNA", "MANAJEMEN_USER", `Menambahkan akun baru: ${data.email} (${data.role}) - Wajib Ganti Password: ${user.mustChangePassword ? "Ya" : "Tidak"}`)

  revalidatePath("/manajemen-user")
  return { id: user.id }
}

export async function editPengguna(id: string, data: {
  name: string, email: string, role: string,
  unitSekolahId?: string, divisiId?: string, isActive: boolean, password?: string,
  mustChangePassword?: boolean
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

  if (data.mustChangePassword !== undefined) {
    updateData.mustChangePassword = data.mustChangePassword
  }

  if (data.password && data.password.trim() !== "") {
    if (data.password !== "albas123") {
      const check = await validatePasswordStrength(data.password)
      if (!check.valid) throw new Error(check.message)
    }
    updateData.password = await bcrypt.hash(data.password, 10)
    updateData.lastPasswordChangeAt = new Date()
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
  const user = await prisma.pengguna.findUnique({ where: { id } })
  if (!user) throw new Error("Pengguna tidak ditemukan")

  const hashedPassword = await bcrypt.hash("albas123", 10)
  
  await prisma.pengguna.update({
    where: { id },
    data: { 
      password: hashedPassword,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  })
  
  await logAktivitas("RESET_PASSWORD", "MANAJEMEN_USER", `Mereset kata sandi akun ${user.email} ke default dan mengaktifkan wajib ganti sandi saat login.`)
  revalidatePath("/manajemen-user")
}

export async function bukaKunciPengguna(id: string) {
  await requireAdmin()
  const user = await prisma.pengguna.findUnique({ where: { id } })
  if (!user) throw new Error("Pengguna tidak ditemukan")

  await prisma.pengguna.update({
    where: { id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  })

  await logAktivitas("BUKA_KUNCI_PENGGUNA", "MANAJEMEN_USER", `Membuka kunci akun pengguna: ${user.email}`)
  revalidatePath("/manajemen-user")
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
    throw new Error("Kata sandi lama tidak sesuai.")
  }

  const check = await validatePasswordStrength(newPassword)
  if (!check.valid) {
    throw new Error(check.message)
  }

  if (oldPassword === newPassword) {
    throw new Error("Kata sandi baru tidak boleh sama dengan kata sandi lama.")
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.pengguna.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword,
      mustChangePassword: false,
      lastPasswordChangeAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  })

  await logAktivitas("GANTI_PASSWORD_MANDIRI", "PROFIL", `Pengguna memperbarui kata sandi secara mandiri.`)
}

export async function getProfilMandiri() {
  const session = await auth()
  if (!session || !session.user?.id) {
    throw new Error("Sesi tidak valid, harap login kembali.")
  }

  const user = await prisma.pengguna.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      unitSekolahId: true,
      lastPasswordChangeAt: true,
      createdAt: true,
      unitSekolah: {
        select: { id: true, name: true, level: true }
      },
      divisi: {
        select: { id: true, name: true }
      }
    }
  })

  if (!user) throw new Error("Pengguna tidak ditemukan.")
  return user
}

export async function updateProfilMandiri(data: { name: string, avatar?: string }) {
  const session = await auth()
  if (!session || !session.user?.id) {
    throw new Error("Sesi tidak valid, harap login kembali.")
  }

  const cleanName = data.name.trim()
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Nama lengkap minimal terdiri dari 2 karakter.")
  }

  const updatedUser = await prisma.pengguna.update({
    where: { id: session.user.id },
    data: {
      name: cleanName,
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true
    }
  })

  await logAktivitas(
    "UPDATE_PROFIL_MANDIRI",
    "PROFIL",
    `Pengguna mengubah nama profil menjadi: ${cleanName}`
  )

  revalidatePath("/")
  return updatedUser
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

export async function hapusPenggunaPermanen(id: string) {
  await requireAdmin()

  const user = await prisma.pengguna.findUnique({
    where: { id },
    include: {
      transaksiDibuat: { select: { id: true }, take: 1 },
      transaksiDiterima: { select: { id: true }, take: 1 }
    }
  })

  if (!user) throw new Error("Pengguna tidak ditemukan")

  // Rule 1: Hanya boleh hapus jika pengguna nonaktif
  if (user.isActive) {
    throw new Error("Pengguna harus dinonaktifkan terlebih dahulu sebelum dapat dihapus permanen.")
  }

  // Rule 2: Larangan hapus akun sendiri & pastikan ada Superadmin aktif lain
  const session = await auth()
  if (session?.user?.id === id) {
    throw new Error("Tidak dapat menghapus akun Anda sendiri yang sedang digunakan!")
  }

  if (user.role === "ADMIN") {
    const activeAdminCount = await prisma.pengguna.count({ where: { role: "ADMIN", isActive: true } })
    if (activeAdminCount < 1) throw new Error("Tidak dapat menghapus Superadmin karena tidak ada Superadmin aktif lain di sistem!")
  }

  // Rule 3: Integritas Finansial - Jangan hapus user dengan riwayat transaksi
  if (user.transaksiDibuat.length > 0 || user.transaksiDiterima.length > 0) {
    throw new Error("Pengguna tidak dapat dihapus permanen karena memiliki riwayat pencatatan transaksi keuangan. Cukup biarkan dalam status Nonaktif agar audit keuangan tetap terjaga.")
  }

  // Rule 4: Preservasi Audit Log - Re-linking ke Sentinel System Archive User
  const SYSTEM_DELETED_EMAIL = "system-deleted@albasyariah.local"
  
  let systemUser = await prisma.pengguna.findUnique({
    where: { email: SYSTEM_DELETED_EMAIL }
  })

  if (!systemUser) {
    const dummyPassword = await bcrypt.hash("SystemProtected123!", 10)
    systemUser = await prisma.pengguna.create({
      data: {
        name: "Pengguna Terhapus",
        email: SYSTEM_DELETED_EMAIL,
        password: dummyPassword,
        role: "SYSTEM",
        isActive: false
      }
    })
  }

  // Ambil semua riwayat log aktivitas milik user ini
  const userLogs = await prisma.logAktivitas.findMany({
    where: { penggunaId: id }
  })

  // Perbarui keterangan dengan prefix identitas asli & re-assign ke systemUser
  if (userLogs.length > 0) {
    for (const log of userLogs) {
      await prisma.logAktivitas.update({
        where: { id: log.id },
        data: {
          penggunaId: systemUser.id,
          keterangan: `[Eks: ${user.name} (${user.email})] ${log.keterangan}`
        }
      })
    }
  }

  // Hapus akun pengguna secara permanen dari basis data
  await prisma.pengguna.delete({
    where: { id }
  })

  // Catat aksi penghapusan permanen oleh Admin yang sedang bertugas
  await logAktivitas(
    "HAPUS_PENGGUNA_PERMANEN",
    "MANAJEMEN_USER",
    `Menghapus permanen akun: ${user.name} (${user.email}). Sebanyak ${userLogs.length} riwayat aktivitas telah dialihkan ke arsip sistem.`
  )

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
