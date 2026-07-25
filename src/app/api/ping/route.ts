import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    
    // Ambil data user
    const user = await prisma.pengguna.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const fifteenMins = 15 * 60 * 1000

    // Hanya update ke database jika lastActiveAt null ATAU sudah lebih dari 15 menit yang lalu
    if (!user.lastActiveAt || (now.getTime() - user.lastActiveAt.getTime() > fifteenMins)) {
      await prisma.pengguna.update({
        where: { id: userId },
        data: { lastActiveAt: now }
      })
      return NextResponse.json({ success: true, message: "Updated lastActiveAt" })
    }

    return NextResponse.json({ success: true, message: "Skipped update (throttled)" })
  } catch (error) {
    console.error("Ping Error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
