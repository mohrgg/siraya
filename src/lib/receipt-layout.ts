/**
 * Konfigurasi & Utility untuk Interactive Receipt Studio & Print Preview.
 */

export type PaperSize = "hvs-bagi-2" | "legal-f4" | "a4"

export interface PaperDimension {
  id: PaperSize
  name: string
  description: string
  widthMm: number
  heightMm: number
  orientation: "landscape" | "portrait"
  // Ukuran CSS @page
  cssPageSize: string
}

export const PAPER_PRESETS: Record<PaperSize, PaperDimension> = {
  "hvs-bagi-2": {
    id: "hvs-bagi-2",
    name: "HVS Bagi 2 (1/2 Folio / A5)",
    description: "215 × 165 mm (Landscape) - Standar kwitansi pembayaran sekolah",
    widthMm: 215,
    heightMm: 165,
    orientation: "landscape",
    cssPageSize: "215mm 165mm"
  },
  "legal-f4": {
    id: "legal-f4",
    name: "Legal / F4 (Kertas Panjang)",
    description: "215 × 330 mm (Portrait) - Format panjang arsip rincian banyak",
    widthMm: 215,
    heightMm: 330,
    orientation: "portrait",
    cssPageSize: "215mm 330mm"
  },
  "a4": {
    id: "a4",
    name: "A4 Standar",
    description: "210 × 297 mm (Portrait) - Standar printer kantor umum",
    widthMm: 210,
    heightMm: 297,
    orientation: "portrait",
    cssPageSize: "210mm 297mm"
  }
}

export interface ReceiptLayoutConfig {
  paperSize: PaperSize
  customWidthMm: number // Lebar kustom kertas dalam mm (140 - 280 mm, default sesuai preset)
  paddingHorizontal: number // Margin / spasi tepi samping dalam px (0 s/d 44 px, default: 16)
  columnNominalWidth: number // Lebar kolom nominal dalam px (110 s/d 260 px, default: 160)
  scale: number // 70% s/d 140% (default 100)
  fillVertical: boolean // Apakah meregangkan konten memenuhi panjang kertas (true/false)
  tableRowSpacing: "compact" | "normal" | "spacious" // Kepadatan baris tabel
  signatureOffsetY: number // Offset spasi vertikal tanda tangan dalam px (0 s/d 80px)
  signatureMode: "ganda" | "tunggal-kanan" | "tunggal-tengah"
  kiriTitle: string
  kiriNama: string
  kananTitle: string
  kananNama: string
  showKop: boolean
  showTerbilang: boolean
  showCatatan: boolean
  customCatatan?: string
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptLayoutConfig = {
  paperSize: "hvs-bagi-2",
  customWidthMm: 215,
  paddingHorizontal: 16,
  columnNominalWidth: 160,
  scale: 100,
  fillVertical: false,
  tableRowSpacing: "normal",
  signatureOffsetY: 20,
  signatureMode: "ganda",
  kiriTitle: "Penyetor / Wali Murid,",
  kiriNama: "",
  kananTitle: "Bendahara Penerima,",
  kananNama: "Staf Keuangan",
  showKop: true,
  showTerbilang: true,
  showCatatan: true,
  customCatatan: ""
}

const STORAGE_KEY = "siraya_receipt_studio_prefs_v1"

export function loadReceiptPreferences(unitId?: string): Partial<ReceiptLayoutConfig> {
  if (typeof window === "undefined") return {}
  try {
    const key = unitId ? `${STORAGE_KEY}_${unitId}` : STORAGE_KEY
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    console.warn("Gagal memuat preferensi kwitansi:", e)
    return {}
  }
}

export function saveReceiptPreferences(config: ReceiptLayoutConfig, unitId?: string): void {
  if (typeof window === "undefined") return
  try {
    const key = unitId ? `${STORAGE_KEY}_${unitId}` : STORAGE_KEY
    // Simpan preferensi layout umum
    const toSave: Partial<ReceiptLayoutConfig> = {
      paperSize: config.paperSize,
      customWidthMm: config.customWidthMm,
      paddingHorizontal: config.paddingHorizontal,
      columnNominalWidth: config.columnNominalWidth,
      scale: config.scale,
      fillVertical: config.fillVertical,
      tableRowSpacing: config.tableRowSpacing,
      signatureOffsetY: config.signatureOffsetY,
      signatureMode: config.signatureMode,
      kananTitle: config.kananTitle,
      showKop: config.showKop,
      showTerbilang: config.showTerbilang,
      showCatatan: config.showCatatan,
      customCatatan: config.customCatatan
    }
    localStorage.setItem(key, JSON.stringify(toSave))
  } catch (e) {
    console.warn("Gagal menyimpan preferensi kwitansi:", e)
  }
}

/**
 * Generator kalimat Terbilang Rupiah dalam Bahasa Indonesia.
 * Contoh: 250000 -> "Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function terbilangRupiah(nominal: number): string {
  if (!nominal || isNaN(nominal) || nominal <= 0) return "Nol Rupiah"

  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]

  function bilangan(n: number): string {
    if (n < 12) return satuan[n]
    if (n < 20) return `${bilangan(n - 10)} Belas`
    if (n < 100) return `${bilangan(Math.floor(n / 10))} Puluh ${bilangan(n % 10)}`
    if (n < 200) return `Seratus ${bilangan(n - 100)}`
    if (n < 1000) return `${bilangan(Math.floor(n / 100))} Ratus ${bilangan(n % 100)}`
    if (n < 2000) return `Seribu ${bilangan(n - 1000)}`
    if (n < 1000000) return `${bilangan(Math.floor(n / 1000))} Ribu ${bilangan(n % 1000)}`
    if (n < 1000000000) return `${bilangan(Math.floor(n / 1000000))} Juta ${bilangan(n % 1000000)}`
    if (n < 1000000000000) return `${bilangan(Math.floor(n / 1000000000))} Miliar ${bilangan(n % 1000000000)}`
    return `${bilangan(Math.floor(n / 1000000000000))} Triliun ${bilangan(n % 1000000000000)}`
  }

  const hasil = bilangan(Math.floor(nominal)).replace(/\s+/g, " ").trim()
  return `${hasil} Rupiah`
}
