import prisma from "@/lib/prisma"
import UserClient from "./UserClient"

export default async function UsersPage() {
  const users = await prisma.pengguna.findMany({
    orderBy: { createdAt: "desc" }
  })

  return <UserClient initialUsers={users} />
}
