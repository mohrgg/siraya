"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import prisma from "@/lib/prisma"

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string || "").trim().toLowerCase()

  try {
    // Periksa status terkunci sebelum mencoba signIn
    if (email) {
      const user = await prisma.pengguna.findUnique({
        where: { email },
        select: { lockedUntil: true, failedLoginAttempts: true }
      })

      if (user?.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60)))
        return {
          error: `Akun terkunci sementara karena 5 kali percobaan gagal. Coba lagi dalam ${remainingMinutes} menit atau hubungi Administrator.`,
          isLocked: true,
          remainingMinutes
        }
      }
    }

    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false,
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      if (email) {
        const user = await prisma.pengguna.findUnique({
          where: { email },
          select: { lockedUntil: true, failedLoginAttempts: true }
        })

        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60)))
          return {
            error: `Akun Anda telah dikunci sementara selama 15 menit karena mencapai batas 5 kali kesalahan kata sandi.`,
            isLocked: true,
            remainingMinutes
          }
        } else if (user && user.failedLoginAttempts > 0) {
          const sisa = Math.max(0, 5 - user.failedLoginAttempts)
          return {
            error: `Email atau kata sandi salah. Sisa kesempatan: ${sisa} kali sebelum akun terkunci.`,
            sisaPercobaan: sisa,
            isLocked: false
          }
        }
      }
      return { error: "Email atau kata sandi yang Anda masukkan salah." }
    }
    throw error
  }
}
