import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const activeTahun = await prisma.tahunAkademik.findFirst({
    where: { isActive: true, isDeleted: false }
  })
  console.log("Active Tahun Akademik:", activeTahun)
}

main().catch(console.error).finally(() => prisma.$disconnect())
