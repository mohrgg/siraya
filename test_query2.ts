import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const units = await prisma.unitSekolah.findMany({
    select: { 
      name: true, 
      _count: { select: { murid: { where: { isActive: true } }, subKelas: true, guru: { where: { isDeleted: false, isActive: true } } } } 
    }
  })
  console.log(JSON.stringify(units, null, 2))
}
main()
