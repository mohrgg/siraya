"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function setGlobalContext(unitSekolahId?: string, tahunAkademikId?: string) {
  const cookieStore = await cookies()
  
  if (unitSekolahId !== undefined && unitSekolahId !== null) {
    cookieStore.set("activeUnitId", unitSekolahId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax"
    })
  }

  // Hanya perbarui activeYearId jika diberikan nilai yang valid (bukan string kosong)
  if (tahunAkademikId) {
    cookieStore.set("activeYearId", tahunAkademikId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax"
    })
  }

  revalidatePath("/", "layout")
  return { success: true }
}
