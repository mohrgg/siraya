import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const units = await prisma.unitSekolah.findMany({
    select: { name: true, _count: { select: { murid: true, subKelas: true, guru: true } } }
  })
  console.log(JSON.stringify(units, null, 2))
}
main()
