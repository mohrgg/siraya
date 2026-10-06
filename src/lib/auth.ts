import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "./prisma"

const DUMMY_HASH = "$2a$10$wN9v8Yf3Xw27q8bUvG5qkeLvhxJpM4k7zV9P0L3J1nN9q9bUvG5qk"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

        const user = await prisma.pengguna.findUnique({
          where: { email }
        })

        // Pencegahan Timing Attack: jalankan hash comparison bahkan jika user tidak ada
        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH)
          return null
        }

        if (!user.isActive) {
          await bcrypt.compare(password, DUMMY_HASH)
          return null
        }

        const now = new Date()

        // Periksa apakah akun sedang dalam periode terkunci (Lockout)
        if (user.lockedUntil && user.lockedUntil > now) {
          // Log penolakan login karena akun terkunci
          try {
            await prisma.logAktivitas.create({
              data: {
                penggunaId: user.id,
                aksi: "LOGIN_DITOLAK_TERKUNCI",
                modul: "AUTENTIKASI",
                keterangan: `Percobaan login ditolak karena akun sedang terkunci hingga ${user.lockedUntil.toLocaleTimeString("id-ID")}`
              }
            })
          } catch (e) {
            console.error("Gagal mencatat log login tertolak:", e)
          }
          return null
        }

        // Jika periode lockout sudah lewat, pulihkan hitungan
        const isLockoutExpired = user.lockedUntil && user.lockedUntil <= now
        const currentFailedAttempts = isLockoutExpired ? 0 : (user.failedLoginAttempts || 0)

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          const newFailedAttempts = currentFailedAttempts + 1
          const isNowLocked = newFailedAttempts >= 5
          const newLockedUntil = isNowLocked ? new Date(Date.now() + 15 * 60 * 1000) : null

          try {
            await prisma.pengguna.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedUntil: newLockedUntil
              }
            })

            await prisma.logAktivitas.create({
              data: {
                penggunaId: user.id,
                aksi: isNowLocked ? "AKUN_TERKUNCI" : "LOGIN_GAGAL",
                modul: "AUTENTIKASI",
                keterangan: isNowLocked
                  ? "Akun terkunci otomatis selama 15 menit setelah 5 kali gagal memasukkan kata sandi."
                  : `Percobaan login gagal (ke-${newFailedAttempts} dari 5).`
              }
            })
          } catch (e) {
            console.error("Gagal memperbarui status percobaan login:", e)
          }

          return null
        }

        // Login Berhasil: Reset kegagalan dan perbarui lastActiveAt
        try {
          await prisma.pengguna.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastActiveAt: now
            }
          })

          await prisma.logAktivitas.create({
            data: {
              penggunaId: user.id,
              aksi: "LOGIN",
              modul: "SISTEM",
              keterangan: "Pengguna berhasil login ke dalam sistem"
            }
          })
        } catch (e) {
          console.error("Gagal mencatat log login sukses:", e)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          unitSekolahId: user.unitSekolahId,
          divisiId: user.divisiId,
          avatar: user.avatar,
          mustChangePassword: user.mustChangePassword
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.unitSekolahId = user.unitSekolahId
        token.divisiId = user.divisiId
        token.avatar = user.avatar
        token.mustChangePassword = user.mustChangePassword
      }
      if (trigger === "update" && session) {
        if (session.user?.mustChangePassword !== undefined) {
          token.mustChangePassword = session.user.mustChangePassword
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.unitSekolahId = token.unitSekolahId as string | null
        session.user.divisiId = token.divisiId as string | null
        session.user.avatar = token.avatar as string | null
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      const appBase = process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.APP_URL || baseUrl
      if (url.startsWith("/")) {
        return `${appBase}${url}`
      }
      try {
        const parsed = new URL(url)
        if (parsed.hostname === "0.0.0.0") {
          return `${appBase}/login`
        }
        if (parsed.origin === baseUrl || (appBase && parsed.origin === new URL(appBase).origin)) {
          return url
        }
      } catch {
        // ignore invalid URL
      }
      return `${appBase}/login`
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
})
