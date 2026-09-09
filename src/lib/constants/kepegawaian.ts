/**
 * Standardisasi Status Kepegawaian Guru & Tenaga Kependidikan
 * Standar baku sekolah / yayasan pendidikan Indonesia (Dapodik / Kemenag / Yayasan)
 * Tanpa singkatan seperti GTT, GTY, PTY, PTT.
 */

export const STATUS_KEPEGAWAIAN_LIST = [
  "Guru Tetap Yayasan",
  "Guru Tidak Tetap",
  "Guru Kontrak",
  "Pegawai Tetap Yayasan",
  "Pegawai Tidak Tetap",
  "Pegawai Negeri Sipil (PNS / DPK)",
  "Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)",
  "Tenaga Administrasi Sekolah",
  "Tenaga Keamanan",
  "Tenaga Kebersihan",
] as const

export type StatusKepegawaian = typeof STATUS_KEPEGAWAIAN_LIST[number]

/**
 * Normalisasi nilai status kepegawaian (termasuk konversi singkatan lama)
 */
export function normalizeStatusKepegawaian(val?: string | null): string {
  if (!val) return ""
  const trimmed = val.trim()
  if (trimmed === "-" || trimmed === "") return ""

  const upper = trimmed.toUpperCase()

  // Pemetaan singkatan lama ke nama standar baku
  if (upper === "GTY") return "Guru Tetap Yayasan"
  if (upper === "GTT" || upper === "HONOR" || upper === "HONORER") return "Guru Tidak Tetap"
  if (upper === "KONTRAK" || upper === "GURU KONTRAK") return "Guru Kontrak"
  if (upper === "PTY") return "Pegawai Tetap Yayasan"
  if (upper === "PTT") return "Pegawai Tidak Tetap"
  if (upper === "PNS" || upper === "DPK" || upper === "ASN" || upper.includes("PNS")) return "Pegawai Negeri Sipil (PNS / DPK)"
  if (upper === "PPPK") return "Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)"
  if (upper === "STAF TU" || upper === "STAFF TU" || upper === "TU" || upper === "TATA USAHA") return "Tenaga Administrasi Sekolah"
  if (upper === "SATPAM" || upper === "SECURITY") return "Tenaga Keamanan"
  if (upper === "OB" || upper === "OFFICE BOY" || upper === "KEBERSIHAN") return "Tenaga Kebersihan"

  // Cek apakah sudah cocok persis dengan salah satu daftar baku
  const matched = STATUS_KEPEGAWAIAN_LIST.find(s => s.toLowerCase() === trimmed.toLowerCase())
  if (matched) return matched

  return trimmed
}

/**
 * Cek apakah status kepegawaian merupakan pegawai/guru tetap
 */
export function isStatusTetap(status?: string | null): boolean {
  if (!status) return false
  const norm = normalizeStatusKepegawaian(status)
  return norm === "Guru Tetap Yayasan" || norm === "Pegawai Tetap Yayasan" || norm === "Pegawai Negeri Sipil (PNS / DPK)"
}

/**
 * Cek apakah status kepegawaian merupakan guru/pegawai tidak tetap / honorer / kontrak
 */
export function isStatusHonorer(status?: string | null): boolean {
  if (!status) return false
  const norm = normalizeStatusKepegawaian(status)
  return norm === "Guru Tidak Tetap" || norm === "Pegawai Tidak Tetap" || norm === "Guru Kontrak"
}

/**
 * Cek apakah status valid untuk monitoring (bukan placeholder "-" atau kosong)
 */
export function isValidMonitoringStatus(status?: string | null): boolean {
  if (!status) return false
  const trimmed = status.trim()
  return trimmed !== "" && trimmed !== "-" && trimmed.toLowerCase() !== "belum ditentukan"
}

/**
 * Palet warna badge status kepegawaian
 */
export function getStatusBadgeStyle(status?: string | null): string {
  const norm = normalizeStatusKepegawaian(status)
  switch (norm) {
    case "Guru Tetap Yayasan":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "Guru Tidak Tetap":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Guru Kontrak":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Pegawai Tetap Yayasan":
      return "bg-teal-50 text-teal-700 border-teal-200"
    case "Pegawai Tidak Tetap":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "Pegawai Negeri Sipil (PNS / DPK)":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)":
      return "bg-indigo-50 text-indigo-700 border-indigo-200"
    case "Tenaga Administrasi Sekolah":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "Tenaga Keamanan":
    case "Tenaga Kebersihan":
      return "bg-slate-100 text-slate-700 border-slate-200"
    default:
      return "bg-slate-100 text-slate-500 border-slate-200"
  }
}
