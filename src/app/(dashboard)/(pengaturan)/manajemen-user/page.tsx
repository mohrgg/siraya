import UserClient from "./UserClient"
import prisma from "@/lib/prisma"
import { getPengguna, getDivisi } from "@/actions/pengguna"

export default async function UserPage() {
  const users = await getPengguna()
  const divisis = await getDivisi()
  const units = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <UserClient 
        initialUsers={users}
        initialDivisi={divisis}
        units={units}
      />
    </div>
  )
}
