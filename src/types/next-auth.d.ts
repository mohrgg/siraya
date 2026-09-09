import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      unitSekolahId: string | null
      divisiId: string | null
      avatar: string | null
      mustChangePassword?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    unitSekolahId: string | null
    divisiId: string | null
    avatar: string | null
    mustChangePassword?: boolean
  }
}
