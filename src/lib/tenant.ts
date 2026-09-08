import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

export type TenantContext = {
  /** Role dari pengguna yang sedang login */
  role: string
  /** 
   * ID Unit Sekolah yang aktif. 
   * Jika null, berarti pengguna sedang dalam mode "Semua Unit" (Global)
   */
  unitId: string | null
  /**
   * Apakah mode Global ("Semua Unit") sedang aktif? 
   * Hanya bernilai true jika role = ADMIN dan activeUnitId = "all"
   */
  isGlobal: boolean
  /** Data user lengkap dari session */
  user: any
}

/**
 * Mengambil konteks tenant/unit secara aman (Security-First).
 * Fungsi ini mem-bypass cookie jika user bukan ADMIN, mencegah manipulasi cookie.
 * Wajib digunakan di seluruh Server Actions dan komponen pembacaan data.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized: User not found in session")
  }
  
  const role = session.user.role || "TATA_USAHA"
  const userUnitId = (session.user as any).unitSekolahId
  
  if (role === "ADMIN" || role === "YAYASAN") {
    // Admin dan Yayasan berhak membaca cookie activeUnitId untuk audit unit tertentu atau semua unit
    const cookieStore = await cookies()
    const activeUnitId = cookieStore.get("activeUnitId")?.value || "all"
    
    if (activeUnitId === "all") {
      return { role, unitId: null, isGlobal: true, user: session.user }
    }
    
    return { role, unitId: activeUnitId, isGlobal: false, user: session.user }
  }
  
  // Non-Admin / Non-Yayasan: Wajib menggunakan unitId dari session, cookie diabaikan!
  if (!userUnitId) {
    throw new Error("Unauthorized: User tidak memiliki akses ke unit manapun.")
  }
  
  return { role, unitId: userUnitId, isGlobal: false, user: session.user }
}

/**
 * Helper untuk menyusun where clause Prisma berdasarkan tenant.
 * Gunakan untuk mem-filter data secara otomatis.
 * 
 * @param fieldName Nama field unit di database (default: 'unitSekolahId')
 * @returns Object condition untuk disebar ke dalam where clause prisma
 */
export async function buildTenantWhere(fieldName = "unitSekolahId") {
  const tenant = await getTenantContext()
  
  // Jika global, tidak ada filter unit (menampilkan semua)
  if (tenant.isGlobal) return {}
  
  return { [fieldName]: tenant.unitId }
}
