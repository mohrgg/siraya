import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  PdfInstitutionInfo,
  PdfSignatory,
  ExportTablePdfOptions,
  ExportResiPdfOptions,
  ExportJurnalPdfOptions,
  ExportIncomeStatementPdfOptions
} from './pdf-types'

/**
 * Format nominal Rupiah
 */
const formatRp = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

/**
 * Helper menggambar Tanda Tangan
 */
export function drawTandaTangan(
  doc: jsPDF, 
  pageWidth: number, 
  pageHeight: number, 
  finalY: number, 
  institutionInfo: PdfInstitutionInfo,
  tanggalCetak?: Date | string,
  kiri?: PdfSignatory,
  kanan?: PdfSignatory
) {
  let startY = finalY + 14
  
  if (startY + 40 > pageHeight - 20) {
    doc.addPage()
    startY = 30
  }

  const dateObj = typeof tanggalCetak === 'string' ? new Date(tanggalCetak) : (tanggalCetak || new Date())
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const kota = institutionInfo.kotaPenandatangan || "Bandung"

  // ── KIRI: jabatan → spasi ttd (24mm) → nama underline ──────────────────
  if (kiri) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(kiri.jabatan, 20, startY)

    // Underline nama kiri
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    const namaKiriY = startY + 24
    const namaKiriW = doc.getTextWidth(kiri.nama)
    doc.text(kiri.nama, 20, namaKiriY)
    doc.setLineWidth(0.3)
    doc.setDrawColor(15, 23, 42)
    doc.line(20, namaKiriY + 1, 20 + namaKiriW, namaKiriY + 1)
  }

  // ── KANAN: kota+tanggal → spasi ttd (24mm) → nama underline → jabatan ──
  const defKanan = kanan || { jabatan: "Petugas", nama: "__________________________" }
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`${kota}, ${dateStr}`, pageWidth - 20, startY, { align: "right" })

  // Underline nama kanan
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  const namaKananY = startY + 24
  const namaKananW = doc.getTextWidth(defKanan.nama)
  doc.text(defKanan.nama, pageWidth - 20, namaKananY, { align: "right" })
  doc.setLineWidth(0.3)
  doc.setDrawColor(15, 23, 42)
  doc.line(pageWidth - 20 - namaKananW, namaKananY + 1, pageWidth - 20, namaKananY + 1)

  // Jabatan kanan — di bawah nama (seperti PrintSignature)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(defKanan.jabatan, pageWidth - 20, namaKananY + 5, { align: "right" })
}

/**
 * Helper Menggambar Kop Surat - SINKRON dengan PrintHeader HTML
 * Layout: [LOGO kiri] | Nama Yayasan kecil / Nama Unit besar / Alamat | [balancer kanan]
 * Garis: tebal + tipis (double border)
 */
export const drawKopSurat = async (
  docInstance: jsPDF,
  pageWidth: number,
  institutionInfo: PdfInstitutionInfo,
  startY: number = 10
): Promise<number> => {
  const logoSize = 26   // mm — disamakan dengan w-24 h-24 (96px ~ 25.4mm)
  const logoX = 14
  const logoY = startY - 2 // Geser sedikit ke atas agar sejajar tengah
  const textCenterX = pageWidth / 2

  // Muat logo jika ada
  if (institutionInfo.logoUrl) {
    try {
      const imgData = await fetch(institutionInfo.logoUrl)
        .then(r => r.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }))
      const format = (imgData.startsWith('data:image/png') || institutionInfo.logoUrl.toLowerCase().includes('.png')) ? 'PNG' : 'JPEG'
      docInstance.addImage(imgData, format, logoX, logoY, logoSize, logoSize)
    } catch {
      // Lanjutkan tanpa logo jika gagal
    }
  }

  let textY = startY + 4

  if (institutionInfo.namaUnit) {
    const yayasanText = institutionInfo.namaYayasan.toUpperCase().split('').join(' ')
    const unitText = institutionInfo.namaUnit.toUpperCase().split('').join(' ')

    // Skema 1: Ada unit — nama yayasan kecil di atas, nama unit besar
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(11) // text-[14px]
    docInstance.setTextColor(30, 41, 59)
    docInstance.text(yayasanText, textCenterX, textY, { align: "center" })
    textY += 7

    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(20) // text-[26px]
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(unitText, textCenterX, textY, { align: "center" })
    textY += 7
  } else {
    const yayasanText = institutionInfo.namaYayasan.toUpperCase().split('').join(' ')
    // Skema 2: Tanpa unit — nama yayasan besar
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(22) // text-[26px]
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(yayasanText, textCenterX, textY + 4, { align: "center" })
    textY += 12
  }

  // Subtitle: alamat • telp • email
  const parts: string[] = []
  if (institutionInfo.alamat) parts.push(institutionInfo.alamat)
  if (institutionInfo.telepon) parts.push(`Telp: ${institutionInfo.telepon}`)
  if (institutionInfo.email) parts.push(`Email: ${institutionInfo.email}`)
  if (institutionInfo.website) parts.push(`Web: ${institutionInfo.website}`)

  if (parts.length > 0) {
    const kopSubtitle = parts.join(' \u2022 ')
    docInstance.setFont("helvetica", "normal")
    docInstance.setFontSize(9) // text-[13px]
    docInstance.setTextColor(51, 65, 85)
    // Constraint max-w-2xl HTML setara dengan ~170mm
    const maxSubtitleWidth = Math.min(pageWidth - 60, 170)
    const splitSubtitle = docInstance.splitTextToSize(kopSubtitle, maxSubtitleWidth)
    splitSubtitle.forEach((line: string) => {
      docInstance.text(line, textCenterX, textY, { align: "center" })
      textY += 4.5
    })
  }

  // Garis ganda persis seperti PrintHeader HTML
  const lineY = Math.max(textY + 2, startY + logoSize - 2)
  docInstance.setLineWidth(1.2) // border-b-[4px]
  docInstance.setDrawColor(15, 23, 42)
  docInstance.line(14, lineY, pageWidth - 14, lineY)

  docInstance.setLineWidth(0.3) // border-b-[1px]
  docInstance.line(14, lineY + 2, pageWidth - 14, lineY + 2)

  return lineY + 2
}

/**
 * Versi SYNC dari drawKopSurat (tanpa logo) — digunakan di callback didDrawPage.
 */
const drawKopSuratSync = (
  docInstance: jsPDF,
  pageWidth: number,
  institutionInfo: PdfInstitutionInfo,
  startY: number = 10
): number => {
  const textCenterX = pageWidth / 2
  let textY = startY + 4

  if (institutionInfo.namaUnit) {
    const yayasanText = institutionInfo.namaYayasan.toUpperCase().split('').join(' ')
    const unitText = institutionInfo.namaUnit.toUpperCase().split('').join(' ')

    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(11) // text-[14px]
    docInstance.setTextColor(30, 41, 59)
    docInstance.text(yayasanText, textCenterX, textY, { align: "center" })
    textY += 7
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(20) // text-[26px]
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(unitText, textCenterX, textY, { align: "center" })
    textY += 7
  } else {
    const yayasanText = institutionInfo.namaYayasan.toUpperCase().split('').join(' ')
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(22) // text-[26px]
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(yayasanText, textCenterX, textY + 4, { align: "center" })
    textY += 12
  }

  const parts: string[] = []
  if (institutionInfo.alamat) parts.push(institutionInfo.alamat)
  if (institutionInfo.telepon) parts.push(`Telp: ${institutionInfo.telepon}`)
  if (institutionInfo.email) parts.push(`Email: ${institutionInfo.email}`)
  if (parts.length > 0) {
    const sub = parts.join(' \u2022 ')
    docInstance.setFont("helvetica", "normal")
    docInstance.setFontSize(9) // text-[13px]
    docInstance.setTextColor(51, 65, 85)
    const maxSubtitleWidth = Math.min(pageWidth - 60, 170)
    const split = docInstance.splitTextToSize(sub, maxSubtitleWidth)
    split.forEach((line: string) => { docInstance.text(line, textCenterX, textY, { align: "center" }); textY += 4.5 })
  }

  const logoSize = 26
  const lineY = Math.max(textY + 2, startY + logoSize - 2)
  docInstance.setLineWidth(1.2) // border-b-[4px]
  docInstance.setDrawColor(15, 23, 42)
  docInstance.line(14, lineY, pageWidth - 14, lineY)
  docInstance.setLineWidth(0.3) // border-b-[1px]
  docInstance.line(14, lineY + 2, pageWidth - 14, lineY + 2)
  return lineY + 2
}

/**
 * Helper menggambar Footer
 */
const drawFooter = (docInstance: jsPDF, pageWidth: number, pageHeight: number, pageNumber: number, totalPagesExp: string, institutionInfo?: PdfInstitutionInfo) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  // Garis pemisah footer
  const lineY = pageHeight - 18
  docInstance.setLineWidth(0.2)
  docInstance.setDrawColor(209, 213, 219) // gray-300
  docInstance.line(14, lineY, pageWidth - 14, lineY)

  docInstance.setFont("helvetica", "italic")
  docInstance.setFontSize(7.5)
  docInstance.setTextColor(107, 114, 128) // gray-500

  let footerY = lineY + 4
  // Tampilkan catatanKwitansi jika ada (center, seperti PrintFooter)
  if (institutionInfo?.catatanKwitansi) {
    docInstance.text(institutionInfo.catatanKwitansi, pageWidth / 2, footerY, { align: "center" })
    footerY += 4
  }
  docInstance.text(`Dicetak melalui Sistem Informasi Siraya pada ${dateStr}`, pageWidth / 2, footerY, { align: "center" })

  const pageStr = `Hal. ${pageNumber} / ${totalPagesExp}`
  docInstance.text(pageStr, pageWidth - 14, footerY, { align: "right" })
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

    if (!response.ok) {
      throw new Error(`Gagal mengekspor PDF: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename || 'export_tabel'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error("Export PDF error:", error)
    throw error
  }
}

/**
 * Ekspor Resi/Kwitansi Pembayaran Tagihan ke format PDF resmi (A5 Landscape).
 */
export async function exportResiPdf(data: ExportResiPdfOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5' // 210 x 148.5 mm
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // 1. KOP SURAT
  const lineY = await drawKopSurat(doc, pageWidth, data.institutionInfo, 12)
  
  // 2. TANGGAL & NO REF (Kanan Atas sejajar dengan Judul)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  
  const dateObj = typeof data.tanggal === 'string' ? new Date(data.tanggal) : (data.tanggal || new Date())
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  
  // 3. JUDUL KWITANSI
  const titleY = lineY + 9
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("BUKTI PEMBAYARAN / KWITANSI", pageWidth / 2, titleY, { align: "center" })
  
  // underline judul
  const titleWidth = doc.getTextWidth("BUKTI PEMBAYARAN / KWITANSI")
  doc.setLineWidth(0.3)
  doc.line((pageWidth - titleWidth) / 2, titleY + 1.5, (pageWidth + titleWidth) / 2, titleY + 1.5)

  // Tanggal & No ref diletakkan di kanan atas
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Tanggal: ${dateStr}`, pageWidth - 15, titleY - 4, { align: "right" })
  doc.text(`No. Ref: ${data.noReferensi}`, pageWidth - 15, titleY + 1, { align: "right" })
  
  // 4. IDENTITAS
  const identityY = titleY + 10
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Telah terima dari", 15, identityY)
  doc.text(":", 45, identityY)
  doc.setFont("helvetica", "bold")
  doc.text(data.penerimaDari, 48, identityY)
  
  // 5. TABEL RINCIAN
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.keterangan,
    formatRp(item.nominal)
  ])
  
  // Baris Total
  tableData.push(["", "TOTAL PEMBAYARAN", formatRp(data.total)])

  autoTable(doc, {
    startY: identityY + 5,
    head: [["No", "Keterangan Pembayaran", "Nominal"]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 50, fontStyle: 'bold' }
    },
    didParseCell: (dataHook) => {
      // Bold Total Row
      if (dataHook.row.index === tableData.length - 1) {
        dataHook.cell.styles.fontStyle = 'bold'
        dataHook.cell.styles.fillColor = [248, 250, 252]
        if (dataHook.column.index === 1) {
          dataHook.cell.styles.halign = 'right'
        }
      }
    }
  })

  // 6. TANDA TANGAN
  const finalY = (doc as any).lastAutoTable.finalY - 5

  drawTandaTangan(
    doc,
    pageWidth,
    pageHeight,
    finalY,
    data.institutionInfo,
    data.tanggal,
    data.penandatanganKiri || { jabatan: "Penyetor / Wali Murid,", nama: data.penerimaDari },
    data.penandatanganKanan || { jabatan: "Bendahara Penerima,", nama: "Staf Keuangan" }
  )
  
  // 7. CATATAN FOOTER
  const footerY = finalY + 26
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const catatan = data.catatan || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran yang sah."
  doc.text(catatan, pageWidth / 2, footerY, { align: "center" })

  doc.save(data.filename || `Kwitansi_${data.noReferensi}.pdf`)
}

/**
 * Ekspor Jurnal Kas (A4 Portrait).
 */
export async function exportJurnalPdf(data: ExportJurnalPdfOptions) {
  const doc = new jsPDF('portrait')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  let currentY = await drawKopSurat(doc, pageWidth, data.institutionInfo, 12) + 8
  
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 41, 59)
  doc.text(data.judulJurnal.toUpperCase(), pageWidth / 2, currentY, { align: "center" })
  currentY += 8
  
  // Info
  doc.setTextColor(15, 23, 42)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

  const dateObj = typeof data.tanggal === 'string' ? new Date(data.tanggal) : (data.tanggal || new Date())
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  doc.text(`No Referensi : ${data.noReferensi}`, 14, currentY)
  doc.text(`Tanggal      : ${dateStr}`, 14, currentY + 6)
  doc.text(`Deskripsi    : ${data.deskripsi || "-"}`, 14, currentY + 12)

  const tableColumn = ["Kode Akun", "Nama Akun", "Debit", "Kredit"]
  const tableRows = data.detail.map((d) => [
    d.kodeAkun,
    d.namaAkun,
    d.debit > 0 ? formatRp(d.debit) : "-",
    d.kredit > 0 ? formatRp(d.kredit) : "-"
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY + 18,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] } // Slate 800
  })

  const finalY = (doc as any).lastAutoTable.finalY || 70
  
  // Signatures
  drawTandaTangan(
    doc,
    pageWidth,
    pageHeight,
    finalY,
    data.institutionInfo,
    data.tanggal,
    data.penandatanganKiri || { jabatan: "Dibuat Oleh,", nama: "........................" },
    data.penandatanganKanan || { jabatan: "Disetujui Oleh,", nama: "........................" }
  )

  doc.save(data.filename || `Jurnal_${data.noReferensi}.pdf`)
}

/**
 * Ekspor Laporan Pemasukan & Pengeluaran (Income Statement).
 */
export async function exportIncomeStatementPdf({
  institutionInfo,
  startDate,
  endDate,
  data,
  filename,
  tanggalCetak,
  penandatanganKiri,
  penandatanganKanan
}: ExportIncomeStatementPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // 1. KOP SURAT
  const headerY = await drawKopSurat(doc, pageWidth, institutionInfo, 12)
  
  // 2. JUDUL LAPORAN
  let currentY = headerY + 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)
  doc.text("LAPORAN PEMASUKAN DAN PENGELUARAN", pageWidth / 2, currentY, { align: "center" })
  
  currentY += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Periode: ${startDate} - ${endDate}`, pageWidth / 2, currentY, { align: "center" })
  
  // 3. DATA TABEL
  const titleY = currentY + 10

  const tableData: any[] = []

  // --- PENDAPATAN ---
  tableData.push([
    { content: '  PEMASUKAN', colSpan: 4, styles: { textColor: [16, 185, 129], fontStyle: 'bold', fontSize: 8 } }
  ])
  
  if (data.pendapatan.length === 0) {
    tableData.push([
      { content: '    Tidak ada data pendapatan', colSpan: 4, styles: { textColor: [156, 163, 175], fontStyle: 'italic' } }
    ])
  } else {
    data.pendapatan.forEach(p => {
      tableData.push([
        { content: `    ${p.kode}`, styles: { textColor: [30, 41, 59] } },
        { content: p.nama, styles: { textColor: [71, 85, 105] } },
        { content: `Rp.`, styles: { textColor: [71, 85, 105], halign: 'right' } },
        { content: p.total.toLocaleString('id-ID'), styles: { textColor: [71, 85, 105], halign: 'right' } }
      ])
    })
  }

  tableData.push([
    { content: 'Total PENDAPATAN', colSpan: 2, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } },
    { content: data.totalPendapatan.toLocaleString('id-ID'), styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } }
  ])
  
  // Spacer
  tableData.push([{ content: '', colSpan: 4, styles: { cellPadding: 2 } }])

  // --- BIAYA BEBAN ---
  tableData.push([
    { content: 'BIAYA BEBAN', colSpan: 2, styles: { textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 } },
    { content: `Rp.`, styles: { textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' } },
    { content: data.totalPengeluaran.toLocaleString('id-ID'), styles: { textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' } }
  ])
  tableData.push([
    { content: '  PENGELUARAN', colSpan: 4, styles: { textColor: [225, 29, 72], fontStyle: 'bold', fontSize: 8 } }
  ])
  
  if (data.pengeluaran.length === 0) {
    tableData.push([
      { content: '    Tidak ada data pengeluaran', colSpan: 4, styles: { textColor: [156, 163, 175], fontStyle: 'italic' } }
    ])
  } else {
    data.pengeluaran.forEach(p => {
      tableData.push([
        { content: `    ${p.kode}`, styles: { textColor: [30, 41, 59] } },
        { content: p.nama, styles: { textColor: [71, 85, 105] } },
        { content: `Rp.`, styles: { textColor: [71, 85, 105], halign: 'right' } },
        { content: p.total.toLocaleString('id-ID'), styles: { textColor: [71, 85, 105], halign: 'right' } }
      ])
    })
  }

  tableData.push([
    { content: 'Total PENGELUARAN', colSpan: 2, styles: { textColor: [225, 29, 72], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [225, 29, 72], fontStyle: 'bold', halign: 'right' } },
    { content: data.totalPengeluaran.toLocaleString('id-ID'), styles: { textColor: [225, 29, 72], fontStyle: 'bold', halign: 'right' } }
  ])

  // Spacer
  tableData.push([{ content: '', colSpan: 4, styles: { cellPadding: 2 } }])

  // --- SALDO ---
  tableData.push([
    { content: 'Selisih Pemasukan dan Pengeluaran', colSpan: 2, styles: { textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 9 } },
    { content: `Rp.`, styles: { textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' } },
    { content: (data.totalPendapatan - data.totalPengeluaran).toLocaleString('id-ID'), styles: { textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' } }
  ])

  autoTable(doc, {
    startY: titleY + 12,
    head: [[
      { content: 'Keterangan', colSpan: 2, styles: { halign: 'left', textColor: [100, 116, 139] } },
      { content: 'SALDO', colSpan: 2, styles: { halign: 'right', textColor: [30, 41, 59] } }
    ]],
    body: tableData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 1.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      fontStyle: 'bold',
      lineColor: [30, 41, 59], // Slate-800
      lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 }
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 10, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  })
  
  const totalPagesExp = '{total_pages_count_string}'
  
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp)
  }

  // Footer for Income Statement
  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawFooter(doc, pageWidth, pageHeight, i, totalPagesExp, institutionInfo)
  }

  const finalY = (doc as any).lastAutoTable.finalY
  drawTandaTangan(
    doc, 
    pageWidth, 
    pageHeight, 
    finalY, 
    institutionInfo, 
    tanggalCetak, 
    penandatanganKiri, 
    penandatanganKanan
  )

  doc.save(`${filename}.pdf`)
}
