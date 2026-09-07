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
    catatanKwitansi: pengaturan?.catatanKwitansi || null,
  }
}

/**
 * Mendapatkan penandatangan kiri standar (Mengetahui) berbasis konteks Unit vs Yayasan.
 */
export function getSignatoryKiri(pengaturan?: any, unitSekolah?: any): { jabatan: string; nama: string } {
  if (unitSekolah?.namaKepalaSekolah || unitSekolah?.name) {
    return {
      jabatan: "Mengetahui, Kepala Sekolah",
      nama: unitSekolah?.namaKepalaSekolah || "____________________"
    }
  }
  return {
    jabatan: `Mengetahui, ${pengaturan?.jabatanPimpinanYayasan || "Ketua Yayasan"}`,
    nama: pengaturan?.namaPimpinanYayasan || "____________________"
  }
}

