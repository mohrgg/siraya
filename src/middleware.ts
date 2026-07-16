import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login")

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return null
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 3. Cek rute khusus Admin
  const adminRoutes = ["/manajemen-user", "/pengaturan"];
  if (adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return null
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"],
}
