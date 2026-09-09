import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

// Selalu buat instance baru saat file ini direload atau jika ada model baru yang belum terdeteksi
const prisma = (globalThis.prismaGlobal && (globalThis.prismaGlobal as any).statusKepegawaian)
  ? globalThis.prismaGlobal
  : prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma

