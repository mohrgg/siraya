import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PdfTableOptions {
  title: string
  subtitle?: string
  headers: string[]
  data: (string | number)[][]
  filename: string
  schoolUnitName?: string
  unitInfo?: {
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  }
  orientation?: 'portrait' | 'landscape'
}

/**
 * Helper universal untuk mengekspor data tabel menjadi dokumen PDF resmi.
 * Dilengkapi dengan Kop Surat Sekolah, styling vektor berkualitas tinggi,
 * penomoran halaman otomatis, dan footer resmi.
 */
export function exportToPdfTable({
  title,
  subtitle = "",
  headers,
  data,
  filename,
  schoolUnitName = "SISTEM INFORMASI SIRAYA (SIRAYA)",
  unitInfo,
  orientation = 'landscape'
}: PdfTableOptions) {
  if (!data || data.length === 0) {
    console.warn("Data kosong, tidak ada yang diekspor ke PDF")
    return
  }

  // 1. Inisialisasi jsPDF
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const totalPagesExp = '{total_pages_count_string}'

  // 2. Fungsi Menggambar Kop Surat (Header Resmi)
  const drawHeader = (docInstance: jsPDF) => {
    // Teks Kop Surat
    docInstance.setFont("helvetica", "bold")
    docInstance.setFontSize(10)
    docInstance.setTextColor(100, 116, 139) // Slate-500
    docInstance.text("YAYASAN AL-BASYARIAH / SIRAYA EDUCATION", pageWidth / 2, 12, { align: "center" })

    docInstance.setFontSize(15)
    docInstance.setTextColor(15, 23, 42) // Slate-900 (Black/Dark)
    docInstance.text(schoolUnitName.toUpperCase(), pageWidth / 2, 18, { align: "center" })

    docInstance.setFont("helvetica", "normal")
    docInstance.setFontSize(8.5)
    docInstance.setTextColor(71, 85, 105) // Slate-600
    
    // Gunakan unitInfo jika ada, jika tidak gunakan default string
    let kopSubtitle = "Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu"
    if (unitInfo) {
      const parts = []
      if (unitInfo.address) parts.push(unitInfo.address)
      if (unitInfo.phone) parts.push(`Telp: ${unitInfo.phone}`)
      if (unitInfo.email) parts.push(`Email: ${unitInfo.email}`)
      if (unitInfo.website) parts.push(`Web: ${unitInfo.website}`)
      if (parts.length > 0) {
        kopSubtitle = parts.join(' • ')
      }
    }
    
    // Pecah teks jika terlalu panjang agar tidak merembes melewati batas lebar kertas
    const maxSubtitleWidth = pageWidth - 30 // Margin kiri kanan 15mm
    const splitSubtitle = docInstance.splitTextToSize(kopSubtitle, maxSubtitleWidth)
    
    // Tulis subtitle, iterasi per baris jika ada banyak baris
    let startSubY = 23
    splitSubtitle.forEach((line: string) => {
      docInstance.text(line, pageWidth / 2, startSubY, { align: "center" })
      startSubY += 4 // Jarak antar baris
    })

    // Garis Pembatas Kop Surat (Garis tebal + garis tipis)
    const lineY = startSubY + 1
    docInstance.setLineWidth(0.8)
    docInstance.setDrawColor(15, 23, 42)
    docInstance.line(14, lineY, pageWidth - 14, lineY)

    docInstance.setLineWidth(0.2)
    docInstance.line(14, lineY + 1.5, pageWidth - 14, lineY + 1.5)
    
    return lineY + 1.5 // Mengembalikan posisi Y terakhir setelah kop
  }

  // Gambar Kop di halaman pertama
  let currentY = drawHeader(doc) + 8

  // 3. Judul & Subjudul Dokumen
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

  // 4. Render Tabel Vektor dengan AutoTable
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
      fillColor: [5, 150, 105], // Emerald-600 Theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { top: 32, left: 14, right: 14, bottom: 20 },
    didDrawPage: (dataHook) => {
      // Gambar Kop Surat jika halaman baru (di atas halaman 1)
      if (dataHook.pageNumber > 1) {
        drawHeader(doc)
      }

      // 5. Gambar Footer Resmi di setiap halaman
      const footerY = pageHeight - 12
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184) // Slate-400

      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`Dicetak melalui Sistem Informasi Siraya pada ${dateStr}`, 14, footerY)

      // Penomoran Halaman (Halaman X dari {total_pages_count_string})
      const pageStr = `Halaman ${dataHook.pageNumber} dari ${totalPagesExp}`
      doc.text(pageStr, pageWidth - 14, footerY, { align: "right" })
    }
  })

  // 6. Ganti placeholder total halaman dengan angka sebenarnya
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp)
  }

  // 7. Area Tanda Tangan (Mengetahui)
  const finalY = (doc as any).lastAutoTable.finalY + 15
  
  // Periksa apakah halaman masih cukup untuk tanda tangan, jika tidak buat halaman baru
  if (finalY + 30 > pageHeight - 20) {
    doc.addPage()
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text("Bandung, ................................", pageWidth - 20, 30, { align: "right" })
    doc.text("Mengetahui,", pageWidth - 20, 36, { align: "right" })
    doc.text("__________________________", pageWidth - 20, 60, { align: "right" })
  } else {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text("Bandung, ................................", pageWidth - 20, finalY, { align: "right" })
    doc.text("Mengetahui,", pageWidth - 20, finalY + 6, { align: "right" })
    doc.text("__________________________", pageWidth - 20, finalY + 30, { align: "right" })
  }

  // 8. Simpan file PDF
  doc.save(`${filename}.pdf`)
}

export interface PdfResiOptions {
  noReferensi: string
  tanggal: Date
  muridName: string
  unitSekolahName?: string
  namaYayasan?: string
  items: { namaAkun: string, jumlahBayar: number }[]
  total: number
  catatanKwitansi?: string
  namaBendahara?: string
}

/**
 * Ekspor Resi/Kwitansi Pembayaran Tagihan ke format PDF resmi (A5 Landscape).
 */
export function exportResiPdf(data: PdfResiOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a5' // 210 x 148.5 mm
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // 1. KOP SURAT
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(data.namaYayasan || "YAYASAN AL BASYARIAH", 15, 20)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  const unitText = data.unitSekolahName || "BUKTI PEMBAYARAN"
  
  // Word wrap unitText jika panjang
  const splitUnitText = doc.splitTextToSize(unitText, pageWidth / 2 - 20)
  let currentY = 26
  splitUnitText.forEach((line: string) => {
    doc.text(line, 15, currentY)
    currentY += 4
  })
  
  // 2. TANGGAL & NO REF (Kanan Atas)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const dateStr = data.tanggal.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.text(`Tanggal: ${dateStr}`, pageWidth - 15, 20, { align: "right" })
  doc.text(`No. Ref: ${data.noReferensi}`, pageWidth - 15, 25, { align: "right" })
  
  // Garis Pembatas Kop
  const lineY = Math.max(currentY + 2, 32)
  doc.setLineWidth(0.8)
  doc.line(15, lineY, pageWidth - 15, lineY)
  doc.setLineWidth(0.3)
  doc.line(15, lineY + 1.5, pageWidth - 15, lineY + 1.5)
  
  // 3. JUDUL KWITANSI
  const titleY = lineY + 13
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("KWITANSI PEMBAYARAN", pageWidth / 2, titleY, { align: "center" })
  // underline
  const titleWidth = doc.getTextWidth("KWITANSI PEMBAYARAN")
  doc.setLineWidth(0.3)
  doc.line((pageWidth - titleWidth) / 2, titleY + 1.5, (pageWidth + titleWidth) / 2, titleY + 1.5)
  
  // 4. IDENTITAS
  const identityY = titleY + 13
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Telah terima dari", 15, identityY)
  doc.text(":", 45, identityY)
  doc.setFont("helvetica", "bold")
  doc.text(data.muridName, 48, identityY)
  
  // 5. TABEL RINCIAN
  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }
  
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.namaAkun,
    formatRp(item.jumlahBayar)
  ])
  
  // Baris Total
  tableData.push(["", "TOTAL PEMBAYARAN", formatRp(data.total)])

  autoTable(doc, {
    startY: identityY + 7,
    head: [["No", "Keterangan Pembayaran", "Nominal"]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240]
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
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

  // 6. AREA TANDA TANGAN (Footer)
  // Menentukan Y dari akhir tabel
  const finalY = (doc as any).lastAutoTable.finalY + 15
  
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  
  // Kiri: Penyetor
  doc.text("Penyetor / Wali Murid,", 35, finalY, { align: "center" })
  doc.text("( ______________________ )", 35, finalY + 20, { align: "center" })
  doc.text(data.muridName, 35, finalY + 25, { align: "center" })
  
  // Kanan: Bendahara
  doc.text(`Bandung, ${dateStr}`, pageWidth - 35, finalY, { align: "center" })
  doc.text("Bendahara Penerima,", pageWidth - 35, finalY + 5, { align: "center" })
  
  doc.text("( ______________________ )", pageWidth - 35, finalY + 20, { align: "center" })
  const bendahara = data.namaBendahara || "Staf Keuangan"
  doc.text(bendahara, pageWidth - 35, finalY + 25, { align: "center" })

  // Catatan Kwitansi
  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(148, 163, 184)
  const catatan = data.catatanKwitansi || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran yang sah."
  doc.text(catatan, pageWidth / 2, 140, { align: "center" })

  doc.save(`Kwitansi_${data.noReferensi}.pdf`)
}

export interface IncomeStatementPdfOptions {
  startDate: string
  endDate: string
  data: {
    pendapatan: any[]
    totalPendapatan: number
    pengeluaran: any[]
    totalPengeluaran: number
  }
  filename: string
  schoolUnitName?: string
  unitInfo?: {
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  }
}

/**
 * Ekspor Laporan Pemasukan & Pengeluaran ke format Laba/Rugi (Income Statement) profesional.
 */
export function exportIncomeStatementPdf({
  startDate,
  endDate,
  data,
  filename,
  schoolUnitName = "YAYASAN AL BASYARIAH",
  unitInfo
}: IncomeStatementPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // 1. KOP SURAT
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text("YAYASAN AL-BASYARIAH / SIRAYA EDUCATION", pageWidth / 2, 12, { align: "center" })

  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text(schoolUnitName.toUpperCase(), pageWidth / 2, 18, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  
  let kopSubtitle = "Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu"
  if (unitInfo) {
    const parts = []
    if (unitInfo.address) parts.push(unitInfo.address)
    if (unitInfo.phone) parts.push(`Telp: ${unitInfo.phone}`)
    if (unitInfo.email) parts.push(`Email: ${unitInfo.email}`)
    if (unitInfo.website) parts.push(`Web: ${unitInfo.website}`)
    if (parts.length > 0) {
      kopSubtitle = parts.join(' • ')
    }
  }

  // Word wrap untuk alamat
  const splitSubtitle = doc.splitTextToSize(kopSubtitle, pageWidth - 30)
  let currentY = 23
  splitSubtitle.forEach((line: string) => {
    doc.text(line, pageWidth / 2, currentY, { align: "center" })
    currentY += 4
  })

  const lineY = currentY + 1
  doc.setLineWidth(0.8)
  doc.setDrawColor(15, 23, 42)
  doc.line(14, lineY, pageWidth - 14, lineY)
  doc.setLineWidth(0.2)
  doc.line(14, lineY + 1.5, pageWidth - 14, lineY + 1.5)

  // 2. JUDUL
  const titleY = lineY + 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(5, 150, 105) // Emerald-600
  doc.text("LAPORAN PEMASUKAN DAN PENGELUARAN", pageWidth / 2, titleY, { align: "center" })
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(225, 29, 72) // Rose
  doc.text(`per ${startDate} - ${endDate}`, pageWidth / 2, titleY + 5, { align: "center" })

  // 3. TABEL LABA RUGI (Custom AutoTable)
  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)
  }

  const tableData: any[] = []

  // --- PENDAPATAN ---
  tableData.push([
    { content: 'PENDAPATAN', colSpan: 2, styles: { textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 } },
    { content: `Rp.`, styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPendapatan), styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } }
  ])
  tableData.push([
    { content: '  PENDAPATAN', colSpan: 4, styles: { textColor: [16, 185, 129], fontStyle: 'bold', fontSize: 8 } }
  ])
  
  if (data.pendapatan.length === 0) {
    tableData.push([
      { content: '    Tidak ada data pendapatan', colSpan: 4, styles: { textColor: [156, 163, 175], fontStyle: 'italic' } }
    ])
  } else {
    data.pendapatan.forEach(p => {
      tableData.push([
        { content: `    ${p.kode}`, styles: { textColor: [59, 130, 246] } },
        { content: p.nama, styles: { textColor: [75, 85, 99] } },
        { content: `Rp.`, styles: { textColor: [75, 85, 99], halign: 'right' } },
        { content: formatRp(p.total), styles: { textColor: [75, 85, 99], halign: 'right' } }
      ])
    })
  }

  tableData.push([
    { content: 'Total PENDAPATAN', colSpan: 2, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPendapatan), styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } }
  ])
  tableData.push([
    { content: 'Total PENDAPATAN', colSpan: 2, styles: { textColor: [37, 99, 235], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPendapatan), styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } }
  ])
  
  // Spacer
  tableData.push([{ content: '', colSpan: 4, styles: { cellPadding: 2 } }])

  // --- BIAYA BEBAN ---
  tableData.push([
    { content: 'BIAYA BEBAN', colSpan: 2, styles: { textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 } },
    { content: `Rp.`, styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPengeluaran), styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } }
  ])
  tableData.push([
    { content: '  PENGELUARAN', colSpan: 4, styles: { textColor: [16, 185, 129], fontStyle: 'bold', fontSize: 8 } }
  ])
  
  if (data.pengeluaran.length === 0) {
    tableData.push([
      { content: '    Tidak ada data pengeluaran', colSpan: 4, styles: { textColor: [156, 163, 175], fontStyle: 'italic' } }
    ])
  } else {
    data.pengeluaran.forEach(p => {
      tableData.push([
        { content: `    ${p.kode}`, styles: { textColor: [59, 130, 246] } },
        { content: p.nama, styles: { textColor: [75, 85, 99] } },
        { content: `Rp.`, styles: { textColor: [75, 85, 99], halign: 'right' } },
        { content: formatRp(p.total), styles: { textColor: [75, 85, 99], halign: 'right' } }
      ])
    })
  }

  tableData.push([
    { content: 'Total PENGELUARAN', colSpan: 2, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPengeluaran), styles: { textColor: [16, 185, 129], fontStyle: 'bold', halign: 'right' } }
  ])
  tableData.push([
    { content: 'Total BIAYA BEBAN', colSpan: 2, styles: { textColor: [37, 99, 235], fontStyle: 'bold' } },
    { content: `Rp.`, styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPengeluaran), styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } }
  ])

  // Spacer
  tableData.push([{ content: '', colSpan: 4, styles: { cellPadding: 2 } }])

  // --- SALDO ---
  tableData.push([
    { content: 'Selisih Pemasukan dan Pengeluaran', colSpan: 2, styles: { textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 } },
    { content: `Rp.`, styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } },
    { content: formatRp(data.totalPendapatan - data.totalPengeluaran), styles: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' } }
  ])

  autoTable(doc, {
    startY: titleY + 12,
    head: [[
      { content: 'Semua Departemen', colSpan: 2, styles: { halign: 'left', textColor: [100, 116, 139] } },
      { content: 'SALDO', colSpan: 2, styles: { halign: 'right', textColor: [244, 63, 94] } }
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
      lineColor: [5, 150, 105], // Emerald-600
      lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 }
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 10, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' }
    }
  })

  doc.save(`${filename}.pdf`)
}


export const drawKopSurat = (
  docInstance: any,
  pageWidth: number,
  schoolUnitName: string,
  unitInfo?: any,
  startY: number = 12
) => {
  docInstance.setFont("helvetica", "bold")
  docInstance.setFontSize(10)
  docInstance.setTextColor(100, 116, 139)
  docInstance.text("YAYASAN AL-BASYARIAH / SIRAYA EDUCATION", pageWidth / 2, startY, { align: "center" })

  docInstance.setFontSize(15)
  docInstance.setTextColor(15, 23, 42)
  docInstance.text((schoolUnitName || "YAYASAN AL BASYARIAH").toUpperCase(), pageWidth / 2, startY + 6, { align: "center" })

  docInstance.setFont("helvetica", "normal")
  docInstance.setFontSize(8.5)
  docInstance.setTextColor(71, 85, 105)
  
  let kopSubtitle = "Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu"
  if (unitInfo) {
    const parts = []
    if (unitInfo.address) parts.push(unitInfo.address)
    if (unitInfo.phone) parts.push(`Telp: ${unitInfo.phone}`)
    if (unitInfo.email) parts.push(`Email: ${unitInfo.email}`)
    if (unitInfo.website) parts.push(`Web: ${unitInfo.website}`)
    if (parts.length > 0) {
      kopSubtitle = parts.join(' • ')
    }
  }
  
  const splitSubtitle = docInstance.splitTextToSize(kopSubtitle, pageWidth - 30)
  let startSubY = startY + 11
  splitSubtitle.forEach((line: string) => {
    docInstance.text(line, pageWidth / 2, startSubY, { align: "center" })
    startSubY += 4
  })

  const lineY = startSubY + 1
  docInstance.setLineWidth(0.8)
  docInstance.setDrawColor(15, 23, 42)
  docInstance.line(14, lineY, pageWidth - 14, lineY)

  docInstance.setLineWidth(0.2)
  docInstance.line(14, lineY + 1.5, pageWidth - 14, lineY + 1.5)
  
  return lineY + 1.5
}
