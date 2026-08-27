import prisma from "./src/lib/prisma"

async function run() {
  const murid = await prisma.murid.findMany({
    where: { name: { contains: "Adit" } },
    include: {
      riwayatKelas: { include: { subKelas: true } },
      tagihan: true
    }
  })
  console.log(JSON.stringify(murid, null, 2))
}
run()
