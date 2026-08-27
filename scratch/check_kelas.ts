import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tingkats = await prisma.tingkat.findMany({
    orderBy: { order: 'desc' },
    take: 5
  })
  console.log("Recent Tingkat:", tingkats)
  
  const subkelas = await prisma.subKelas.findMany({
    orderBy: { id: 'desc' },
    take: 5
  })
  console.log("Recent SubKelas:", subkelas)
}

main().catch(console.error).finally(() => prisma.$disconnect())
