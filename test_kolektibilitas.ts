import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.time('query')
  const tagihanRaw = await prisma.tagihan.findMany({
    select: {
      jumlah: true,
      sisaTagihan: true,
      murid: { select: { unitSekolahId: true } }
    }
  })
  console.timeEnd('query')
  console.log("Total tagihan records:", tagihanRaw.length)
}
main()
