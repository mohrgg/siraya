import {
  ExportTablePdfOptions,
  ExportResiPdfOptions,
  ExportJurnalPdfOptions,
  ExportIncomeStatementPdfOptions
} from './pdf-types'
async function downloadPdfResponse(response: Response, defaultFilename: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const errorMsg = errorData?.error || errorData?.message || response.statusText || `HTTP ${response.status}`
    throw new Error(`Gagal mengekspor PDF: ${errorMsg}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = defaultFilename.endsWith('.pdf') ? defaultFilename : `${defaultFilename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Helper universal untuk mengekspor data tabel menjadi dokumen PDF resmi.
 */
export async function exportTablePdf({
  institutionInfo,
  title,
  subtitle = "",
  headers,
  data,
  filename,
  config,
  tanggalCetak = new Date(),
  penandatanganKiri,
  penandatanganKanan
}: ExportTablePdfOptions) {
  if (!data || data.length === 0) {
    console.warn("Data kosong, tidak ada yang diekspor ke PDF")
    return
  }

  const payload = {
    type: "table",
    data: {
      institutionInfo,
      title,
      subtitle,
      headers,
      data,
      filename,
      config,
      tanggalCetak,
      penandatanganKiri,
      penandatanganKanan
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, filename || 'export_tabel')
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

/**
 * Ekspor Resi/Kwitansi Pembayaran Tagihan ke format PDF resmi (A5 Landscape).
 */
export async function exportResiPdf(data: ExportResiPdfOptions) {
  const payload = {
    type: "resi",
    data: {
      ...data,
      config: { orientation: 'landscape', format: 'A5' }
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, data.filename || `Kwitansi_${data.noReferensi}.pdf`)
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

/**
 * Ekspor Jurnal Kas (A4 Portrait).
 */
export async function exportJurnalPdf(data: ExportJurnalPdfOptions) {
  const payload = {
    type: "jurnal",
    data: {
      ...data,
      config: { orientation: 'portrait', format: 'A4' }
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, data.filename || `Jurnal_${data.noReferensi}.pdf`)
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

/**
 * Ekspor Laporan Pemasukan & Pengeluaran (Income Statement).
 */
export async function exportIncomeStatementPdf(data: ExportIncomeStatementPdfOptions) {
  const payload = {
    type: "income_statement",
    data: {
      ...data,
      config: { orientation: 'portrait', format: 'A4' }
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, `${data.filename || 'Laporan_Pemasukan_Pengeluaran'}.pdf`)
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

export async function exportMutasiBankPdf(data: any) {
  const payload = {
    type: 'mutasi-bank',
    data: {
      ...data,
      config: { orientation: 'portrait', format: 'A4' }
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, data.filename || 'Mutasi_Bank.pdf')
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

export async function exportTunggakanMatriksPdf(data: any) {
  const payload = {
    type: 'tunggakan-matriks',
    data: {
      ...data,
      config: { orientation: 'landscape', format: 'A4' }
    }
  }

  try {
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await downloadPdfResponse(response, data.filename || `Laporan_Tunggakan.pdf`)
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}
