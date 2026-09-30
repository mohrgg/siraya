export interface PdfInstitutionInfo {
  namaYayasan: string
  namaUnit?: string | null
  alamat?: string | null
  telepon?: string | null
  email?: string | null
  website?: string | null
  logoUrl?: string | null
  kotaPenandatangan?: string | null
  catatanKwitansi?: string | null
}

export interface PdfSignatory {
  jabatan: string
  nama: string
}

export interface PdfConfig {
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'a5'
  margin?: any
}

export interface ExportTablePdfOptions {
  institutionInfo: PdfInstitutionInfo
  title: string
  subtitle?: string
  headers: string[]
  data: (string | number)[][]
  filename: string
  config?: PdfConfig
  tanggalCetak?: Date | string
  penandatanganKiri?: PdfSignatory
  penandatanganKanan?: PdfSignatory
}

export interface ExportResiPdfOptions {
  institutionInfo: PdfInstitutionInfo
  title?: string
  noReferensi: string
  tanggal: Date | string
  penerimaDari: string
  items: { 
    keterangan: string; 
    nominal: number; 
    sisaTagihanAwal?: number;
    potongan?: number;
    kategoriPotongan?: string;
    sisaTagihan?: number;
  }[]
  total: number
  catatan?: string
  terbilang?: string
  penandatanganKiri?: PdfSignatory
  penandatanganKanan?: PdfSignatory
  filename?: string
  config?: { orientation?: 'portrait' | 'landscape', format?: string }
}

export interface ExportJurnalPdfOptions {
  institutionInfo: PdfInstitutionInfo
  judulJurnal: string
  noReferensi: string
  tanggal: Date | string
  deskripsi?: string
  detail: { kodeAkun: string; namaAkun: string; debit: number; kredit: number }[]
  penandatanganKiri?: PdfSignatory
  penandatanganKanan?: PdfSignatory
  filename?: string
}

export interface ExportIncomeStatementPdfOptions {
  institutionInfo: PdfInstitutionInfo
  startDate: string
  endDate: string
  data: {
    pendapatan: { kode: string; nama: string; total: number }[]
    totalPendapatan: number
    pengeluaran: { kode: string; nama: string; total: number }[]
    totalPengeluaran: number
  }
  filename: string
  tanggalCetak?: Date | string
  penandatanganKiri?: PdfSignatory
  penandatanganKanan?: PdfSignatory
}
