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
  let startY = finalY + 15
  
  if (startY + 30 > pageHeight - 20) {
    doc.addPage()
    startY = 30
  }

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(71, 85, 105)

  const dateObj = typeof tanggalCetak === 'string' ? new Date(tanggalCetak) : (tanggalCetak || new Date())
  const dateStr = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  
  const kota = institutionInfo.kotaPenandatangan || "Bandung"
  const tempatTanggal = `${kota}, ${dateStr}`

  // Kanan
  const defKanan = kanan || { jabatan: "Petugas,", nama: "__________________________" }
  doc.text(tempatTanggal, pageWidth - 20, startY, { align: "right" })
  doc.text(defKanan.jabatan, pageWidth - 20, startY + 6, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.text(defKanan.nama, pageWidth - 20, startY + 30, { align: "right" })

  // Kiri
  if (kiri) {
    doc.setFont("helvetica", "normal")
    doc.text(kiri.jabatan, 20, startY + 6, { align: "left" })
    doc.setFont("helvetica", "bold")
    doc.text(kiri.nama, 20, startY + 30, { align: "left" })
  }
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
  const logoSize = 22   // mm
  const logoX = 14
  const logoY = startY
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
    // Skema 1: Ada unit — nama yayasan kecil di atas, nama unit besar
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(9)
    docInstance.setTextColor(30, 41, 59)
    docInstance.text(institutionInfo.namaYayasan.toUpperCase(), textCenterX, textY, { align: "center", charSpace: 1.2 })
    textY += 7

    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(18)
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(institutionInfo.namaUnit.toUpperCase(), textCenterX, textY, { align: "center", charSpace: 0.5 })
    textY += 6
  } else {
    // Skema 2: Tanpa unit — nama yayasan besar
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(18)
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(institutionInfo.namaYayasan.toUpperCase(), textCenterX, textY + 3, { align: "center", charSpace: 0.5 })
    textY += 10
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
    docInstance.setFontSize(8.5)
    docInstance.setTextColor(51, 65, 85)
    const splitSubtitle = docInstance.splitTextToSize(kopSubtitle, pageWidth - 50)
    splitSubtitle.forEach((line: string) => {
      docInstance.text(line, textCenterX, textY, { align: "center" })
      textY += 4
    })
  }

  // Garis ganda persis seperti PrintHeader HTML
  const lineY = Math.max(textY + 2, startY + logoSize + 2)
  docInstance.setLineWidth(0.8)
  docInstance.setDrawColor(15, 23, 42)
  docInstance.line(14, lineY, pageWidth - 14, lineY)

  docInstance.setLineWidth(0.2)
  docInstance.line(14, lineY + 1.5, pageWidth - 14, lineY + 1.5)

  return lineY + 1.5
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
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(9)
    docInstance.setTextColor(30, 41, 59)
    docInstance.text(institutionInfo.namaYayasan.toUpperCase(), textCenterX, textY, { align: "center", charSpace: 1.2 })
    textY += 7
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(18)
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(institutionInfo.namaUnit.toUpperCase(), textCenterX, textY, { align: "center", charSpace: 0.5 })
    textY += 6
  } else {
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(18)
    docInstance.setTextColor(15, 23, 42)
    docInstance.text(institutionInfo.namaYayasan.toUpperCase(), textCenterX, textY + 3, { align: "center", charSpace: 0.5 })
    textY += 10
  }

  const parts: string[] = []
  if (institutionInfo.alamat) parts.push(institutionInfo.alamat)
  if (institutionInfo.telepon) parts.push(`Telp: ${institutionInfo.telepon}`)
  if (institutionInfo.email) parts.push(`Email: ${institutionInfo.email}`)
  if (parts.length > 0) {
    const sub = parts.join(' \u2022 ')
    docInstance.setFont("helvetica", "normal")
    docInstance.setFontSize(8.5)
    docInstance.setTextColor(51, 65, 85)
    const split = docInstance.splitTextToSize(sub, pageWidth - 50)
    split.forEach((line: string) => { docInstance.text(line, textCenterX, textY, { align: "center" }); textY += 4 })
  }

  const lineY = textY + 2
  docInstance.setLineWidth(0.8)
  docInstance.setDrawColor(15, 23, 42)
  docInstance.line(14, lineY, pageWidth - 14, lineY)
  docInstance.setLineWidth(0.2)
  docInstance.line(14, lineY + 1.5, pageWidth - 14, lineY + 1.5)
  return lineY + 1.5
}

/**
 * Helper menggambar Footer
 */
const drawFooter = (docInstance: jsPDF, pageWidth: number, pageHeight: number, pageNumber: number, totalPagesExp: string) => {
  const footerY = pageHeight - 12
  docInstance.setFont("helvetica", "italic")
  docInstance.setFontSize(7.5)
  docInstance.setTextColor(148, 163, 184) // Slate-400

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  docInstance.text(`Dicetak melalui Sistem Informasi Siraya pada ${dateStr}`, 14, footerY)

  const pageStr = `Halaman ${pageNumber} dari ${totalPagesExp}`
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

  const doc = new jsPDF({
    orientation: config?.orientation || 'landscape',
    unit: 'mm',
    format: config?.format || 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const totalPagesExp = '{total_pages_count_string}'

  // Gambar Kop di halaman pertama
  let currentY = await drawKopSurat(doc, pageWidth, institutionInfo, 12) + 8

  // Judul & Subjudul Dokumen
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(5, 150, 105) // Emerald-600
  doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: "center" })
  currentY += 6

  if (subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.setTextColor(71, 85, 105)
    const splitReportSubtitle = doc.splitTextToSize(subtitle, pageWidth - 30)
    splitReportSubtitle.forEach((line: string) => {
      doc.text(line, pageWidth / 2, currentY, { align: "center" })
      currentY += 5
    })
    currentY += 2
  }

  // Render Tabel Vektor dengan AutoTable
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: data,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59], // Slate-800
      overflow: 'linebreak',
      lineColor: [226, 232, 240], // Slate-200
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800 Theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: config?.margin || { top: 32, left: 14, right: 14, bottom: 20 },
    didDrawPage: (dataHook) => {
      if (dataHook.pageNumber > 1) {
        // Untuk halaman lanjutan: kop teks saja (tanpa logo, sync-friendly)
        drawKopSuratSync(doc, pageWidth, institutionInfo, 12)
      }
      drawFooter(doc, pageWidth, pageHeight, dataHook.pageNumber, totalPagesExp)
    }
  })

  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp)
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
    drawFooter(doc, pageWidth, pageHeight, i, totalPagesExp)
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
