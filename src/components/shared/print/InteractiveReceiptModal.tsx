"use client"

import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { 
  X, Printer, FileDown, Share2, CheckCircle2, 
  Settings2, Sliders, ChevronDown, ChevronUp, 
  RotateCcw, Sparkles, FileText, ArrowUpDown,
  Maximize2, Eye, SlidersHorizontal, MoveHorizontal,
  Zap, AlignVerticalSpaceAround
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"
import { exportResiPdf } from "@/lib/pdf"
import PrintHeader from "@/components/shared/print/PrintHeader"
import { 
  PaperSize, 
  PAPER_PRESETS, 
  ReceiptLayoutConfig, 
  DEFAULT_RECEIPT_CONFIG, 
  loadReceiptPreferences, 
  saveReceiptPreferences, 
  terbilangRupiah 
} from "@/lib/receipt-layout"

export type ReceiptData = {
  noReferensi: string
  tanggal: Date | string
  muridName: string
  items: { 
    namaAkun: string
    jumlahBayar: number
    sisaTagihanAwal?: number
    potongan?: number
    kategoriPotongan?: string
    sisaTagihan?: number
  }[]
  total: number
}

interface InteractiveReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
  pengaturan?: any
  unitInfo?: any
  currentUser?: any
}

export default function InteractiveReceiptModal({
  isOpen,
  onClose,
  data,
  pengaturan,
  unitInfo,
  currentUser
}: InteractiveReceiptModalProps) {
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [previewZoom, setPreviewZoom] = useState<"fit" | "100">("fit")
  
  // Konfigurasi Layout & Studio State
  const [config, setConfig] = useState<ReceiptLayoutConfig>(DEFAULT_RECEIPT_CONFIG)
  const [fillMetrics, setFillMetrics] = useState({
    contentHeightPx: 0,
    pageHeightPx: 0,
    contentHeightMm: 0,
    pageHeightMm: 165,
    fillPercent: 0,
    remainingMm: 0,
    isOverflow: false,
    optimalScale: 100
  })

  // Ref khusus ke konten murni kwitansi (Kop s/d Footer)
  const receiptContentRef = useRef<HTMLDivElement>(null)

  // Inisialisasi preferensi dari LocalStorage saat modal dibuka
  useEffect(() => {
    setMounted(true)
    if (isOpen && data) {
      const saved = loadReceiptPreferences(unitInfo?.id)
      setConfig(prev => ({
        ...DEFAULT_RECEIPT_CONFIG,
        ...saved,
        kiriNama: data.muridName || "",
        kananNama: currentUser?.name || prev.kananNama || "Staf Keuangan",
        customCatatan: saved.customCatatan || pengaturan?.catatanKwitansi || ""
      }))
    }
  }, [isOpen, data, unitInfo?.id, currentUser?.name, pengaturan?.catatanKwitansi])

  // Kunci scroll body saat modal aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Deteksi tinggi konten murni terhadap ukuran fisik kertas terpilih
  useEffect(() => {
    if (!isOpen) return

    const updateMetrics = () => {
      const el = receiptContentRef.current
      if (!el) return
      
      const preset = PAPER_PRESETS[config.paperSize]
      const pageHeightMm = preset.heightMm
      // 1 mm ≈ 3.779528 px pada 96 DPI standar browser
      const PX_PER_MM = 3.779528
      const pageHeightPx = pageHeightMm * PX_PER_MM
      
      // Ambil tinggi ter-render murni konten kwitansi
      const actualRenderedHeight = el.getBoundingClientRect().height || el.offsetHeight
      const contentHeightMm = Math.round(actualRenderedHeight / PX_PER_MM)

      const remainingMm = Math.max(0, pageHeightMm - contentHeightMm)
      const fillPercent = Math.min(200, Math.round((contentHeightMm / pageHeightMm) * 100))
      const isOverflow = contentHeightMm > pageHeightMm

      // Hitung skala optimal agar pas 1 lembar jika overflow
      const rawOptimal = Math.floor((pageHeightPx / (actualRenderedHeight || 1)) * 100)
      const optimalScale = Math.max(70, Math.min(120, Math.floor(rawOptimal / 5) * 5))

      setFillMetrics({
        contentHeightPx: actualRenderedHeight,
        pageHeightPx,
        contentHeightMm,
        pageHeightMm,
        fillPercent,
        remainingMm,
        isOverflow,
        optimalScale
      })
    }

    const timer = setTimeout(updateMetrics, 80)
    return () => clearTimeout(timer)
  }, [isOpen, config, data])

  if (!isOpen || !data || !mounted) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)
  }

  const activePreset = PAPER_PRESETS[config.paperSize]
  const effectiveWidthMm = config.customWidthMm || activePreset.widthMm

  // Mode Cepat: Maksimal Penuhi Kertas (Full Width & Full Height)
  const handleMaximizePaper = () => {
    setConfig(prev => ({
      ...prev,
      paddingHorizontal: 6, // Margin samping minimal (lebar maksimal)
      fillVertical: true, // Regangkan memenuhi panjang kertas dari atas sampai bawah
      tableRowSpacing: "spacious", // Baris tabel lega & tinggi
      columnNominalWidth: 175,
      signatureOffsetY: 30
    }))
    toast.success("Konten kwitansi dimaksimalkan memenuhi lebar & panjang kertas!", { icon: "⚡" })
  }

  // Mode Cepat: Mode Kompak Standar
  const handleStandardCompact = () => {
    setConfig(prev => ({
      ...prev,
      paddingHorizontal: 16,
      fillVertical: false,
      tableRowSpacing: "normal",
      columnNominalWidth: 155,
      signatureOffsetY: 20
    }))
    toast("Kembali ke mode layout proporsional standar.", { icon: "📐" })
  }

  // Simpan layout aktif sebagai default
  const handleSaveDefault = () => {
    saveReceiptPreferences(config, unitInfo?.id)
    toast.success("Preferensi layout kwitansi berhasil disimpan sebagai default!")
  }

  // Reset konfigurasi ke awal
  const handleResetConfig = () => {
    setConfig({
      ...DEFAULT_RECEIPT_CONFIG,
      kiriNama: data.muridName || "",
      kananNama: currentUser?.name || "Staf Keuangan",
      customCatatan: pengaturan?.catatanKwitansi || ""
    })
    toast("Pengaturan layout direset ke bawaan.", { icon: "🔄" })
  }

  // Aksi Cetak Printer Fisik (Browser Print)
  const handlePrintBrowser = () => {
    window.print()
  }

  // Aksi Unduh PDF Langsung
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true)
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")
      
      const isLandscape = activePreset.orientation === "landscape"
      const pdfFormat = config.paperSize === "legal-f4" ? "Legal" : config.paperSize === "hvs-bagi-2" ? "A5" : "A4"

      await exportResiPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, unitInfo),
        noReferensi: data.noReferensi,
        tanggal: data.tanggal,
        penerimaDari: data.muridName,
        items: data.items.map(item => ({
          keterangan: item.namaAkun,
          nominal: item.jumlahBayar,
          sisaTagihanAwal: item.sisaTagihanAwal,
          potongan: item.potongan,
          kategoriPotongan: item.kategoriPotongan,
          sisaTagihan: item.sisaTagihan
        })),
        total: data.total,
        catatan: config.showCatatan ? (config.customCatatan || pengaturan?.catatanKwitansi) : "",
        penandatanganKiri: config.signatureMode === "ganda" 
          ? { jabatan: config.kiriTitle, nama: config.kiriNama || data.muridName }
          : undefined,
        penandatanganKanan: { 
          jabatan: config.kananTitle, 
          nama: config.kananNama || currentUser?.name || "Staf Keuangan" 
        },
        terbilang: config.showTerbilang ? terbilangRupiah(data.total) : undefined,
        config: {
          orientation: isLandscape ? "landscape" : "portrait",
          format: pdfFormat
        },
        filename: `Kwitansi_${data.noReferensi}`
      })
      toast.success("Berhasil mengunduh Bukti Pembayaran (PDF)")
    } catch (err: any) {
      toast.error("Gagal membuat PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Aksi Bagikan WhatsApp
  const handleShareWA = () => {
    const yayasanName = pengaturan?.namaYayasan || "Yayasan Al Basyariah"
    const unitName = unitInfo?.name ? ` - ${unitInfo.name}` : ""
    const dateFormatted = format(new Date(data.tanggal), "dd MMMM yyyy", { locale: idLocale })
    
    const text = `*BUKTI PEMBAYARAN RESMI*\n${yayasanName}${unitName}\n\n` +
      `No. Ref: *${data.noReferensi}*\n` +
      `Tanggal: ${dateFormatted}\n` +
      `Santri/Siswa: *${data.muridName}*\n\n` +
      `*Rincian Pembayaran:*\n` +
      data.items.map(item => `- ${item.namaAkun}: ${formatRupiah(item.jumlahBayar)}`).join("\n") +
      `\n\n*Total Bayar: ${formatRupiah(data.total)}*\n` +
      `_Terbilang: ${terbilangRupiah(data.total)}_\n\n` +
      (config.showCatatan && (config.customCatatan || pengaturan?.catatanKwitansi) ? `_Catatan: ${config.customCatatan || pengaturan?.catatanKwitansi}_\n\n` : "") +
      `Terima kasih atas pembayaran Anda.`
      
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, "_blank")
  }

  const tanggalStr = format(new Date(data.tanggal), "dd MMMM yyyy", { locale: idLocale })
  const kotaStr = unitInfo?.kotaPenandatangan || pengaturan?.kotaPenandatangan || "Bandung"

  // Skala zoom pratinjau kanvas
  const canvasZoomScale = previewZoom === "100" 
    ? 1 
    : config.paperSize === "legal-f4" 
      ? 0.70 
      : config.paperSize === "a4" 
        ? 0.75 
        : 0.88

  // Padding baris tabel dinamis
  const tableCellPadding = config.tableRowSpacing === "spacious" 
    ? "py-4 sm:py-5" 
    : config.tableRowSpacing === "compact" 
      ? "py-1.5" 
      : "py-2.5 sm:py-3"

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-3 print:p-0 touch-manipulation">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      {/* Modal Container */}
      <div 
        className="relative bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[100dvh] sm:h-[94vh] z-10 pointer-events-auto print:h-auto print:max-w-none print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CSS Dinamis untuk Cetak Browser */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden !important; }
            .print-receipt-sheet, .print-receipt-sheet * { visibility: visible !important; }
            .print-receipt-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: ${config.fillVertical ? "100%" : "auto"} !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: transparent !important;
            }
            .no-print { display: none !important; }
            @page {
              size: ${effectiveWidthMm}mm ${activePreset.heightMm}mm;
              margin: 6mm;
            }
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        `}} />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-bg/60 no-print shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-text-main m-0 leading-tight truncate">
                  Pratinjau & Kustomisasi Kwitansi
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {activePreset.name.split(" ")[0]} ({effectiveWidthMm} × {activePreset.heightMm} mm)
                </span>
                {config.fillVertical && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ⚡ Penuh Kertas
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-relaxed truncate">
                No. Ref: <span className="font-semibold text-text-main">{data.noReferensi}</span> • Siswa: <span className="font-semibold text-text-main">{data.muridName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSettings ? "bg-primary/10 text-primary" : "bg-bg hover:bg-gray-100 text-text-muted hover:text-text-main"
              }`}
              title={showSettings ? "Sembunyikan Panel Pengaturan" : "Buka Panel Pengaturan"}
              type="button"
            >
              <Settings2 size={16} />
              <span className="hidden md:inline">{showSettings ? "Sembunyikan Panel" : "Buka Pengaturan"}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split-View Studio */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-100/80">
          
          {/* Panel Kiri: Pengaturan & Studio Controls (Full Customizable) */}
          {showSettings && (
            <div className="w-full md:w-88 lg:w-96 border-b md:border-b-0 md:border-r border-border bg-white flex flex-col shrink-0 no-print max-h-[44vh] md:max-h-none overflow-y-auto">
              
              <div className="p-4 sm:p-5 space-y-5 text-sm">

                {/* Tombol Aksi Cepat: Penuhi Kertas */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500 fill-amber-500" /> Mode Cepat Layout
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleMaximizePaper}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        config.fillVertical && config.paddingHorizontal <= 8
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span>⚡ Penuhi Kertas</span>
                      <span className="text-[10px] font-normal opacity-85 mt-0.5">Maks Lebar & Panjang</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStandardCompact}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        !config.fillVertical
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span>📐 Standar Kompak</span>
                      <span className="text-[10px] font-normal opacity-85 mt-0.5">Kwitansi Alami</span>
                    </button>
                  </div>
                </div>
                
                {/* 1. Format & Ukuran Kertas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider">
                      1. Format & Ukuran Kertas
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mb-3">
                    {(Object.keys(PAPER_PRESETS) as PaperSize[]).map((key) => {
                      const p = PAPER_PRESETS[key]
                      const isSelected = config.paperSize === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setConfig(prev => ({ 
                            ...prev, 
                            paperSize: key,
                            customWidthMm: p.widthMm
                          }))}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" 
                              : "border-border/80 hover:border-gray-300 text-text-main bg-white"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-1.5">
                              {p.name}
                              {key === "hvs-bagi-2" && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">Utama / Pas</span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5">
                              {p.widthMm} × {p.heightMm} mm ({p.orientation})
                            </div>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary text-white" : "border-gray-300"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Slider Atur Lebar Kertas Fisik (mm) */}
                  <div className="bg-bg/50 p-2.5 rounded-xl border border-border/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium flex items-center gap-1">
                        <MoveHorizontal size={13} /> Lebar Lembar Kertas:
                      </span>
                      <span className="font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                        {effectiveWidthMm} mm
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={150}
                      max={260}
                      step={1}
                      value={effectiveWidthMm}
                      onChange={(e) => setConfig(prev => ({ ...prev, customWidthMm: Number(e.target.value) }))}
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span>150 mm (Ramping)</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, customWidthMm: 215 }))}
                          className="hover:text-primary underline cursor-pointer"
                        >
                          215mm (F4)
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, customWidthMm: 210 }))}
                          className="hover:text-primary underline cursor-pointer"
                        >
                          210mm (A4)
                        </button>
                      </div>
                      <span>260 mm (Lebar)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Pengaturan Lebar & Spasi Konten (Agar Maksimal & Tidak Menumpuk) */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={13} className="text-primary" /> 2. Lebar & Spasi Konten
                    </label>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Kecilkan margin samping untuk melebarkan area tabel hingga ke pinggir kertas.
                  </p>

                  {/* Slider Margin Tepi Samping (Padding Horizontal) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted font-medium">Jarak Tepi Samping (Margin):</span>
                      <span className="font-mono text-text-main font-bold">
                        {config.paddingHorizontal === 0 ? "0px (Maksimal / Nol Tepi)" : `${config.paddingHorizontal}px`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={40}
                      step={2}
                      value={config.paddingHorizontal}
                      onChange={(e) => setConfig(prev => ({ ...prev, paddingHorizontal: Number(e.target.value) }))}
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                      <span className="font-bold text-primary">0px (Maksimal Penuh)</span>
                      <span>16px (Normal)</span>
                      <span>40px (Longgar)</span>
                    </div>
                  </div>

                  {/* Slider Lebar Kolom Nominal */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted font-medium">Lebar Kolom Nominal:</span>
                      <span className="font-mono text-text-main font-bold">{config.columnNominalWidth}px</span>
                    </div>
                    <input 
                      type="range"
                      min={110}
                      max={260}
                      step={5}
                      value={config.columnNominalWidth}
                      onChange={(e) => setConfig(prev => ({ ...prev, columnNominalWidth: Number(e.target.value) }))}
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                      <span>110px</span>
                      <span>160px (Standar)</span>
                      <span>260px (Maksimal)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Distribusi Panjang & Spasi Vertikal */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <label className="block text-xs font-bold text-text-main uppercase tracking-wider">
                    3. Panjang & Tinggi Halaman
                  </label>

                  {/* Toggle Penuhi Panjang Kertas */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-bg/40 cursor-pointer hover:bg-bg transition-colors">
                    <div>
                      <div className="font-bold text-xs text-text-main flex items-center gap-1.5">
                        <AlignVerticalSpaceAround size={14} className="text-primary" />
                        Penuhi Panjang Kertas
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Regangkan tanda tangan & footer ke dasar kertas
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={config.fillVertical}
                      onChange={(e) => setConfig(prev => ({ ...prev, fillVertical: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  {/* Spasi Baris Tabel */}
                  <div>
                    <span className="text-[11px] text-text-muted font-medium mb-1.5 block">Tinggi / Spasi Baris Tabel:</span>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {(["compact", "normal", "spacious"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, tableRowSpacing: mode }))}
                          className={`py-1.5 px-2 rounded-lg border font-semibold text-center transition-all ${
                            config.tableRowSpacing === mode
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-text-muted hover:text-text-main"
                          }`}
                        >
                          {mode === "compact" ? "Rapat" : mode === "normal" ? "Sedang" : "Lega & Tinggi"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Skala Konten (Resize) */}
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider">
                      4. Skala Ukuran Font & Elemen
                    </label>
                    <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                      {config.scale}%
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-2 leading-relaxed">
                    Ubah ukuran teks tanpa meninggalkan celah kosong di bawah footer.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, scale: Math.max(70, prev.scale - 5) }))}
                      className="px-2.5 py-1 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 text-text-main"
                    >
                      -5%
                    </button>
                    <input 
                      type="range"
                      min={70}
                      max={140}
                      step={5}
                      value={config.scale}
                      onChange={(e) => setConfig(prev => ({ ...prev, scale: Number(e.target.value) }))}
                      className="flex-1 accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, scale: Math.min(140, prev.scale + 5) }))}
                      className="px-2.5 py-1 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 text-text-main"
                    >
                      +5%
                    </button>
                  </div>
                </div>

                {/* 5. Pengaturan Tanda Tangan */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider">
                      5. Tanda Tangan & Posisi
                    </label>
                  </div>

                  {/* Mode Tanda Tangan */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, signatureMode: "ganda" }))}
                      className={`p-2 text-center rounded-xl border font-medium transition-all ${
                        config.signatureMode === "ganda" 
                          ? "border-primary bg-primary/5 text-primary font-bold" 
                          : "border-border text-text-muted hover:text-text-main"
                      }`}
                    >
                      2 Pihak (Kiri & Kanan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, signatureMode: "tunggal-kanan" }))}
                      className={`p-2 text-center rounded-xl border font-medium transition-all ${
                        config.signatureMode === "tunggal-kanan" 
                          ? "border-primary bg-primary/5 text-primary font-bold" 
                          : "border-border text-text-muted hover:text-text-main"
                      }`}
                    >
                      1 Pihak (Bendahara)
                    </button>
                  </div>

                  {/* Slider Offset Vertikal */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted font-medium flex items-center gap-1">
                        <ArrowUpDown size={12} /> Spasi / Jarak TTD:
                      </span>
                      <span className="font-mono text-text-main font-semibold">{config.signatureOffsetY}px</span>
                    </div>
                    <input 
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={config.signatureOffsetY}
                      onChange={(e) => setConfig(prev => ({ ...prev, signatureOffsetY: Number(e.target.value) }))}
                      className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                      <span>Rapat (0px)</span>
                      <span>Sedang (20px)</span>
                      <span>Longgar (80px)</span>
                    </div>
                  </div>

                  {/* Edit Jabatan & Nama Penandatangan */}
                  <div className="space-y-2 text-xs bg-bg/50 p-2.5 rounded-xl border border-border/60">
                    <div>
                      <span className="text-[10px] text-text-muted font-semibold uppercase">Penandatangan Kanan (Penerima):</span>
                      <input 
                        type="text"
                        value={config.kananNama}
                        onChange={(e) => setConfig(prev => ({ ...prev, kananNama: e.target.value }))}
                        placeholder="Nama Bendahara..."
                        className="w-full mt-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-text-main font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {config.signatureMode === "ganda" && (
                      <div>
                        <span className="text-[10px] text-text-muted font-semibold uppercase">Penandatangan Kiri (Penyetor):</span>
                        <input 
                          type="text"
                          value={config.kiriNama}
                          onChange={(e) => setConfig(prev => ({ ...prev, kiriNama: e.target.value }))}
                          placeholder="Nama Siswa / Wali Murid..."
                          className="w-full mt-1 px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-text-main font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Toggle Komponen */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <label className="block text-xs font-bold text-text-main uppercase tracking-wider mb-2">
                    6. Opsi Tampilan
                  </label>
                  
                  <label className="flex items-center justify-between text-xs text-text-main cursor-pointer p-1.5 hover:bg-bg rounded-lg">
                    <span>Tampilkan Kop Sekolah / Yayasan</span>
                    <input 
                      type="checkbox"
                      checked={config.showKop}
                      onChange={(e) => setConfig(prev => ({ ...prev, showKop: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-text-main cursor-pointer p-1.5 hover:bg-bg rounded-lg">
                    <span>Tampilkan Kalimat Terbilang</span>
                    <input 
                      type="checkbox"
                      checked={config.showTerbilang}
                      onChange={(e) => setConfig(prev => ({ ...prev, showTerbilang: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-text-main cursor-pointer p-1.5 hover:bg-bg rounded-lg">
                    <span>Tampilkan Catatan Kaki</span>
                    <input 
                      type="checkbox"
                      checked={config.showCatatan}
                      onChange={(e) => setConfig(prev => ({ ...prev, showCatatan: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Reset & Simpan Default */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDefault}
                    className="text-xs font-bold text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Sparkles size={12} className="mr-1" /> Simpan Sebagai Default
                  </Button>
                </div>

              </div>

            </div>
          )}

          {/* Panel Kanan: Live WYSIWYG Paper Canvas */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center justify-start bg-slate-200/90 relative">
            
            {/* Status Bar Info, Meteran Keterisian Kertas, & Zoom Toggle */}
            <div className="w-full max-w-[215mm] mb-3 bg-white/95 backdrop-blur border border-slate-300 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs no-print">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span className="font-bold text-slate-800">{activePreset.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">({effectiveWidthMm} × {activePreset.heightMm} mm)</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Meteran Keterisian Kertas */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] font-medium">Keterisian:</span>
                  <div className="w-24 sm:w-28 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        fillMetrics.fillPercent > 100 
                          ? "bg-amber-500" 
                          : fillMetrics.fillPercent > 85 
                          ? "bg-emerald-500" 
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, fillMetrics.fillPercent)}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{fillMetrics.fillPercent}%</span>
                </div>

                {fillMetrics.isOverflow ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⚠️ Melebihi Kertas ({fillMetrics.fillPercent}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sisa Kosong: ~{fillMetrics.remainingMm} mm ({100 - fillMetrics.fillPercent}%)
                  </span>
                )}

                {/* Kontrol Zoom Tampilan Pratinjau */}
                <div className="hidden sm:flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom("fit")}
                    className={`px-2 py-1 text-[10px] font-bold transition-colors ${
                      previewZoom === "fit" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Pas Layar (Seluruh Kertas Terlihat)"
                  >
                    Pas Layar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom("100")}
                    className={`px-2 py-1 text-[10px] font-bold transition-colors ${
                      previewZoom === "100" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Ukuran Nyata 100%"
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>

            {/* Lembar Kertas Fisik (True WYSIWYG Sheet) */}
            <div 
              className="print-receipt-sheet bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-300 relative border border-slate-300/90 flex flex-col justify-start"
              style={{
                width: `${effectiveWidthMm}mm`,
                maxWidth: "100%",
                minHeight: `${activePreset.heightMm}mm`,
                height: config.fillVertical || !fillMetrics.isOverflow ? `${activePreset.heightMm}mm` : "auto",
                transform: canvasZoomScale !== 1 ? `scale(${canvasZoomScale})` : "none",
                transformOrigin: "top center",
                marginBottom: canvasZoomScale !== 1 
                  ? `${Math.max(16, (activePreset.heightMm * (canvasZoomScale - 1) * 3.78) + 32)}px` 
                  : "2rem"
              }}
            >
              {/* Garis Pembatas Margin Cetak (Non-Print Helper) */}
              <div className="absolute inset-0 pointer-events-none border border-dashed border-slate-200/80 m-1 sm:m-2 no-print z-0" />

              {/* Konten Lembar Kertas (Murni Mengalir Bebas Tanpa Celah Kosong Buatan) */}
              <div 
                ref={receiptContentRef} 
                className={`py-4 sm:py-5 text-slate-900 relative z-10 transition-all ${
                  config.fillVertical ? "flex flex-col justify-between h-full flex-1" : "w-full"
                }`}
                style={{
                  paddingLeft: `${config.paddingHorizontal}px`,
                  paddingRight: `${config.paddingHorizontal}px`,
                  width: "100%",
                  zoom: config.scale !== 100 ? `${config.scale}%` : undefined
                }}
              >
                
                {/* Bagian Atas & Tabel */}
                <div className="w-full flex-1 flex flex-col">
                  {/* 1. KOP SURAT */}
                  {config.showKop && (
                    <div className="mb-3">
                      <PrintHeader 
                        unitInfo={unitInfo} 
                        pengaturan={pengaturan} 
                        className="block" 
                      />
                    </div>
                  )}

                  {/* 2. JUDUL KWITANSI & REFERENSI */}
                  <div className="flex justify-between items-end mb-3 text-xs sm:text-sm border-b border-slate-900 pb-1.5 mt-1">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      Kwitansi Pembayaran
                    </h4>
                    <div className="text-right text-[11px] text-slate-600 leading-tight">
                      <div><span className="font-semibold text-slate-700">Tanggal:</span> {tanggalStr}</div>
                      <div><span className="font-semibold text-slate-700">No. Ref:</span> <span className="font-mono font-bold text-slate-900">{data.noReferensi}</span></div>
                    </div>
                  </div>

                  {/* 3. IDENTITAS PENYETOR */}
                  <div className="flex mb-3 text-xs sm:text-sm">
                    <div className="w-32 sm:w-36 text-slate-600 shrink-0">Telah terima dari</div>
                    <div className="w-3 text-slate-600 shrink-0">:</div>
                    <div className="font-bold text-slate-900 truncate">{data.muridName}</div>
                  </div>

                  {/* 4. TABEL RINCIAN PEMBAYARAN (Lebar Kolom Fleksibel & Anti Menumpuk) */}
                  <div className="mb-4 overflow-x-auto page-break-avoid w-full">
                    <table className="w-full text-xs sm:text-sm border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-100 border-y border-slate-300">
                          <th className="py-2 px-3 text-center font-bold text-slate-700 w-10 border-x border-slate-300">No</th>
                          <th className="py-2 px-3 text-left font-bold text-slate-700 border-r border-slate-300">Keterangan Pembayaran</th>
                          <th 
                            className="py-2 px-3 text-right font-bold text-slate-700 border-r border-slate-300"
                            style={{ width: `${config.columnNominalWidth}px` }}
                          >
                            Nominal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className={`${tableCellPadding} px-3 text-center border-x border-slate-200 align-top`}>{idx + 1}</td>
                            <td className={`${tableCellPadding} px-3 text-left border-r border-slate-200 align-top`}>
                              <div className="font-semibold text-slate-800 leading-snug">{item.namaAkun}</div>
                              
                              {Boolean(((item.potongan && item.potongan > 0) || (item.sisaTagihan && item.sisaTagihan > 0)) && item.sisaTagihanAwal && item.sisaTagihanAwal > 0) && (
                                <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                                  Tagihan Awal: {formatRupiah(item.sisaTagihanAwal || 0)}
                                </div>
                              )}
                              
                              {Boolean(item.potongan && item.potongan > 0) && (
                                <div className="text-[10px] text-rose-600 mt-1 italic leading-tight">
                                  Diskon ({item.kategoriPotongan || "Lainnya"}): -{formatRupiah(item.potongan || 0)}
                                </div>
                              )}
                              
                              {Boolean(item.sisaTagihan && item.sisaTagihan > 0) && (
                                <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                                  * Sisa Tagihan Akhir: {formatRupiah(item.sisaTagihan || 0)}
                                </div>
                              )}
                            </td>
                            <td 
                              className={`${tableCellPadding} px-3 text-right border-r border-slate-200 font-semibold align-top whitespace-nowrap`}
                              style={{ width: `${config.columnNominalWidth}px` }}
                            >
                              {formatRupiah(item.jumlahBayar)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-800">
                          <td colSpan={2} className="py-2.5 px-3 text-right border-x border-slate-300 uppercase text-xs">
                            Total Pembayaran
                          </td>
                          <td 
                            className="py-2.5 px-3 text-right border-r border-slate-300 text-slate-900 text-sm whitespace-nowrap font-mono font-black"
                            style={{ width: `${config.columnNominalWidth}px` }}
                          >
                            {formatRupiah(data.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 5. TERBILANG OTOMATIS */}
                  {config.showTerbilang && (
                    <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded text-[11px] sm:text-xs italic text-slate-700 page-break-avoid">
                      <span className="font-semibold text-slate-800 not-italic">Terbilang: </span>
                      {terbilangRupiah(data.total)}
                    </div>
                  )}
                </div>

                {/* Bagian Bawah: Tanda Tangan & Footer */}
                <div className={`w-full ${config.fillVertical ? "mt-auto pt-6" : ""}`}>
                  {/* 6. BLOK TANDA TANGAN (Offset Vertikal Terkendali) */}
                  <div 
                    className="page-break-avoid transition-all duration-150"
                    style={{ marginTop: `${Math.max(12, config.signatureOffsetY)}px` }}
                  >
                    <div className="flex justify-between items-start text-xs sm:text-sm">
                      {/* TTD Kiri (Penyetor) */}
                      {config.signatureMode === "ganda" ? (
                        <div className="text-center w-52 sm:w-60">
                          <p className="text-[11px] text-slate-500 min-h-[1.25rem] mb-0.5">&nbsp;</p>
                          <p className="text-xs font-semibold text-slate-800 leading-tight mb-14 sm:mb-16">
                            {config.kiriTitle}
                          </p>
                          <p className="text-xs sm:text-sm font-bold underline underline-offset-4 text-slate-900">
                            {config.kiriNama || data.muridName || "____________________"}
                          </p>
                        </div>
                      ) : (
                        <div className="w-52 sm:w-60" /> /* Spacer */
                      )}

                      {/* TTD Kanan (Bendahara) */}
                      <div className="text-center w-52 sm:w-60">
                        <p className="text-[11px] text-slate-600 min-h-[1.25rem] mb-0.5">
                          {kotaStr}, {tanggalStr}
                        </p>
                        <p className="text-xs font-semibold text-slate-800 leading-tight mb-14 sm:mb-16">
                          {config.kananTitle}
                        </p>
                        <p className="text-xs sm:text-sm font-bold underline underline-offset-4 text-slate-900">
                          {config.kananNama || currentUser?.name || "Staf Keuangan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 7. CATATAN KAKI / FOOTER */}
                  {config.showCatatan && (
                    <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] sm:text-xs text-slate-500 italic page-break-avoid">
                      <p className="mb-0.5">{config.customCatatan || pengaturan?.catatanKwitansi || "Terima kasih atas pembayaran Anda. Simpan kwitansi ini sebagai bukti pembayaran yang sah."}</p>
                      <p className="text-[9px] text-slate-400">Dicetak melalui Sistem Informasi Siraya</p>
                    </div>
                  )}
                </div>

              </div>

              {/* SISA RUANG KERTAS KOSONG FISIK (Menempel Langsung di Bawah Catatan Kaki) */}
              {!config.fillVertical && !fillMetrics.isOverflow && (
                <div className="no-print flex-1 w-full flex flex-col items-center justify-center p-6 border-t-2 border-dashed border-slate-300/80 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px] text-center select-none min-h-[75px] m-0">
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-300/90 shadow-sm rounded-xl px-5 py-3.5 max-w-md">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
                      <span>📄 Sisa Ruang Kertas Kosong</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Tersisa ruang kosong sekitar <span className="font-extrabold text-primary font-mono text-sm">~{fillMetrics.remainingMm} mm</span> ({100 - fillMetrics.fillPercent}%) pada kertas <span className="font-semibold text-slate-800">{activePreset.name}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={handleMaximizePaper}
                      className="mt-2 text-[11px] font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Zap size={12} /> Klik untuk meregangkan kwitansi memenuhi seluruh kertas
                    </button>
                  </div>
                </div>
              )}

              {/* Garis Batas Potong Jika Melebihi Kertas */}
              {fillMetrics.isOverflow && (
                <div className="no-print my-6 w-full border-t-2 border-dashed border-rose-500 relative flex items-center justify-center">
                  <span className="bg-rose-50 text-rose-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-300 shadow-xs flex items-center gap-1">
                    ✂️ Batas Lembar 1 ({activePreset.heightMm} mm) — Konten Melebihi Kertas ({fillMetrics.fillPercent}%)
                  </span>
                </div>
              )}

            </div>

            {/* Indikator Peringatan & Auto-Scale Jika Konten Melebihi Kertas */}
            {fillMetrics.isOverflow && (
              <div className="w-full max-w-[215mm] mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📄</span>
                  <div>
                    <span className="font-bold text-amber-950">Konten melebihi 1 lembar {activePreset.name} (Keterisian {fillMetrics.fillPercent}%).</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">Kecilkan skala konten atau lebarkan kertas/margin agar seluruh rincian pas dalam 1 lembar kertas tanpa terpotong.</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setConfig(prev => ({ ...prev, scale: fillMetrics.optimalScale }))}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs"
                >
                  Kecilkan ke {fillMetrics.optimalScale}% Otomatis
                </Button>
              </div>
            )}

          </div>

        </div>

        {/* Action Bar Bawah (Tegas & Jelas) */}
        <div className="p-3 sm:p-4 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 no-print shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1 sm:flex-initial min-h-[40px] text-xs font-semibold"
            >
              Tutup
            </Button>
            <Button 
              onClick={handleShareWA} 
              variant="outline" 
              className="flex-1 sm:flex-initial min-h-[40px] text-xs font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <Share2 size={15} className="mr-1.5" /> Bagikan WA
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Tombol Cetak Biasa (Printer Fisik) */}
            <Button 
              onClick={handlePrintBrowser} 
              className="flex-1 sm:flex-initial min-h-[40px] text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
            >
              <Printer size={15} className="mr-1.5" /> Cetak Biasa (Printer)
            </Button>

            {/* Tombol Sebagai PDF Langsung */}
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isExportingPDF}
              className="flex-1 sm:flex-initial min-h-[40px] text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
            >
              <FileDown size={15} className="mr-1.5" /> 
              {isExportingPDF ? "Memproses PDF..." : "Sebagai PDF Langsung"}
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}
