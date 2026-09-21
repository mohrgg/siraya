import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logAppError } from "@/lib/error-logger"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await auth()

    const {
      name = "ClientError",
      message = "Unhandled Client Exception",
      stack,
      url,
      path,
      digest,
      metadata
    } = body

    // Ambil IP Address dan User-Agent dari request headers
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null
    const userAgent = req.headers.get("user-agent") || null

    await logAppError({
      error: {
        name,
        message,
        stack
      },
      source: "CLIENT_COMPONENT",
      severity: "ERROR",
      digest,
      request: {
        url: url || req.nextUrl.toString(),
        path: path || req.nextUrl.pathname,
        method: "CLIENT",
        statusCode: 500,
        ipAddress,
        userAgent
      },
      user: session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
            unitSekolahId: (session.user as any)?.unitSekolahId
          }
        : undefined,
      metadata
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to record client telemetry" },
      { status: 500 }
    )
  }
}
