import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PdfTableOptions {
  title: string
  subtitle?: string
  headers: string[]
  data: (string | number)[][]
  filename: string
  schoolUnitName?: string
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
    docInstance.text("Jl. Pendidikan Nusantara No. 123, Bandung, Jawa Barat • Telp: (022) 1234567 • Email: info@siraya.edu", pageWidth / 2, 23, { align: "center" })

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
