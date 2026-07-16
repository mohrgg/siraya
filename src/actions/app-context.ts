"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function setGlobalContext(unitSekolahId: string, tahunAkademikId: string) {
  const cookieStore = await cookies()
  
  cookieStore.set("activeUnitId", unitSekolahId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax"
  })

  cookieStore.set("activeYearId", tahunAkademikId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax"
  })

  revalidatePath("/", "layout")
  return { success: true }
}
