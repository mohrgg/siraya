/**
 * Helper formatter identitas pengguna untuk UI Siraya
 */

export function formatDisplayName(name?: string | null): string {
  if (!name) return "Pengguna"
  
  const trimmed = name.trim()
  if (!trimmed) return "Pengguna"

  // Ganti underscore dan hyphen berlebih menjadi spasi
  const clean = trimmed.replace(/[_\-]+/g, " ")

  // Ubah ke Title Case
  return clean
    .split(/\s+/)
    .map(word => {
      if (!word) return ""
      // Jaga singkatan umum tetap kapital jika sudah kapital (misal SMP, SMA, SMK, SD, S.Pd)
      if (/^(SD|SMP|SMA|SMK|MA|MTs|MI|SPP|LPJ|TIK|IT)$/i.test(word)) {
        return word.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")
}

export function formatRoleLabel(role?: string | null): string {
  if (!role) return "Pengguna"
  
  const normalized = role.trim().toUpperCase()
  switch (normalized) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "Administrator"
    case "KEPALA_SEKOLAH":
      return "Kepala Sekolah"
    case "TATA_USAHA":
      return "Tata Usaha"
    case "YAYASAN":
      return "Pengurus Yayasan"
    default:
      return formatDisplayName(role)
  }
}

export function getRoleBadgeStyle(role?: string | null) {
  const normalized = (role || "").toUpperCase()
  switch (normalized) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "bg-purple-500/15 text-purple-200 border-purple-400/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50"
    case "KEPALA_SEKOLAH":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
    case "YAYASAN":
      return "bg-amber-500/15 text-amber-200 border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
    case "TATA_USAHA":
    default:
      return "bg-blue-500/15 text-blue-200 border-blue-400/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50"
  }
}
