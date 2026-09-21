import { PrismaClient } from "@prisma/client"

const isEdge = process.env.NEXT_RUNTIME === "edge"

const prismaClientSingleton = () => {
  if (isEdge) {
    // Kembalikan proxy aman agar tidak memicu inisialisasi native di Edge Runtime (Middleware)
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "then") return undefined
        return () => {
          throw new Error(`PrismaClient cannot be executed in Edge Runtime (${String(prop)})`)
        }
      }
    })
  }
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

// Selalu buat instance baru saat file ini direload atau jika ada model baru yang belum terdeteksi
const prisma = isEdge
  ? prismaClientSingleton()
  : (globalThis.prismaGlobal && (globalThis.prismaGlobal as any).statusKepegawaian && (globalThis.prismaGlobal as any).errorLog)
    ? globalThis.prismaGlobal
    : prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production" && !isEdge) {
  globalThis.prismaGlobal = prisma
}
