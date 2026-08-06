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
    
    docInstance.text(kopSubtitle, pageWidth / 2, 23, { align: "center" })

    // Garis Pembatas Kop Surat (Garis tebal + garis tipis)
    docInstance.setLineWidth(0.8)
    docInstance.setDrawColor(15, 23, 42)
    docInstance.line(14, 26, pageWidth - 14, 26)

    docInstance.setLineWidth(0.2)
    docInstance.line(14, 27.5, pageWidth - 14, 27.5)
  }

  // Gambar Kop di halaman pertama
  drawHeader(doc)

  // 3. Judul & Subjudul Dokumen
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(30, 58, 138) // Blue-900 / Primary
  doc.text(title.toUpperCase(), pageWidth / 2, 36, { align: "center" })

  let startY = 42
  if (subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9.5)
    doc.setTextColor(71, 85, 105)
    doc.text(subtitle, pageWidth / 2, startY, { align: "center" })
    startY += 6
  }

  // 4. Render Tabel Vektor dengan AutoTable
  autoTable(doc, {
    startY: startY,
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
      fillColor: [30, 58, 138], // Blue-900 / Deep Indigo Theme
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

  // 7. Simpan file PDF
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
  doc.text(data.unitSekolahName || "BUKTI PEMBAYARAN", 15, 26)
  
  // 2. TANGGAL & NO REF (Kanan Atas)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const dateStr = data.tanggal.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.text(`Tanggal: ${dateStr}`, pageWidth - 15, 20, { align: "right" })
  doc.text(`No. Ref: ${data.noReferensi}`, pageWidth - 15, 25, { align: "right" })
  
  // Garis Pembatas Kop
  doc.setLineWidth(0.8)
  doc.line(15, 32, pageWidth - 15, 32)
  doc.setLineWidth(0.3)
  doc.line(15, 33.5, pageWidth - 15, 33.5)
  
  // 3. JUDUL KWITANSI
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("KWITANSI PEMBAYARAN", pageWidth / 2, 45, { align: "center" })
  // underline
  const titleWidth = doc.getTextWidth("KWITANSI PEMBAYARAN")
  doc.setLineWidth(0.3)
  doc.line((pageWidth - titleWidth) / 2, 46.5, (pageWidth + titleWidth) / 2, 46.5)
  
  // 4. IDENTITAS
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Telah terima dari", 15, 58)
  doc.text(":", 45, 58)
  doc.setFont("helvetica", "bold")
  doc.text(data.muridName, 48, 58)
  
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
    startY: 65,
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
