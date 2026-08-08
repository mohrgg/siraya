import { PdfInstitutionInfo } from "./pdf-types"

/**
 * Membangun PdfInstitutionInfo dari data pengaturan + unit sekolah.
 * Dipanggil 1x di setiap consumer sebelum export.
 */
export function buildInstitutionInfo(
  pengaturan?: any,
  unitSekolah?: any
): PdfInstitutionInfo {
  return {
    namaYayasan: pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH",
    namaUnit: unitSekolah?.name || null,
    alamat: unitSekolah?.address || pengaturan?.alamat || null,
    telepon: unitSekolah?.phone || pengaturan?.telepon || null,
    email: unitSekolah?.email || pengaturan?.email || null,
    website: unitSekolah?.website || pengaturan?.website || null,
    logoUrl: unitSekolah?.logo || pengaturan?.logoUrl || null,
    kotaPenandatangan: unitSekolah?.kotaPenandatangan || pengaturan?.kotaPenandatangan || "Bandung",
  }
}
