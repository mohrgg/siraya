"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, UploadCloud, AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, ArrowLeft, ArrowRight, Eye, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react"
import Papa from "papaparse"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"

interface ImportGuruModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  schoolUnits: any[]
}

interface PreviewRow {
  rowNum: number
  nip: string
  nama: string
  gender: string
  statusKepegawaian: string
  status: 'valid' | 'invalid'
  errors: string[]
  rawRow: any
}

export default function ImportGuruModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  schoolUnits
}: ImportGuruModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; msg: string }[] } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && schoolUnits.length > 0 && !selectedUnit) {
      setSelectedUnit(schoolUnits[0].id)
    }
    if (!isOpen) {
      setCurrentStep(1)
      setFile(null)
      setPreviewRows([])
      setResult(null)
      setIsProcessing(false)
    }
  }, [isOpen, schoolUnits])

  if (!isOpen) return null

  const parseAndValidateFile = async (selectedFile: File) => {
    try {
      let jsonData: any[] = []

      if (selectedFile.name.endsWith('.csv')) {
        jsonData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error: any) => reject(error)
          })
        })
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      }

      if (!jsonData || jsonData.length === 0) {
        toast.error("File tidak berisi data atau format tidak dikenali.")
        return
      }

      const rows: PreviewRow[] = jsonData.map((row: any, i: number) => {
        const rowNum = i + 2
        const nip = (row["NIP"] || "").toString().trim()
        const nama = (row["Nama Lengkap *"] || row["Nama Lengkap"] || "").toString().trim()
        
        let jk = (row["Jenis Kelamin"] || "").toString().trim()
        if (jk.toUpperCase() === "L") jk = "Laki-laki"
        else if (jk.toUpperCase() === "P") jk = "Perempuan"
        
        let statusKepegawaian = (row["Status Kepegawaian *"] || row["Status Kepegawaian"] || "").toString().trim()
        if (!statusKepegawaian) {
          statusKepegawaian = "GTY"
        }

        const errors: string[] = []
        if (!nama) errors.push("Nama Lengkap wajib diisi")
        if (!["GTY", "GTT", "PNS", "DPK", "PPPK", "Honor", "Staf TU", "Satpam", "OB"].includes(statusKepegawaian)) {
          errors.push(`Status Kepegawaian '${statusKepegawaian}' tidak valid. Hanya: GTY, GTT, PNS, DPK, PPPK, Honor, Staf TU, Satpam, OB.`)
        }

        return {
          rowNum,
          nip,
          nama,
          gender: jk,
          statusKepegawaian,
          status: errors.length > 0 ? 'invalid' : 'valid',
          errors,
          rawRow: row
        }
      })

      setPreviewRows(rows)
      setCurrentStep(2)
      toast.success(`Berhasil membaca ${rows.length} baris data`)

    } catch (error: any) {
      toast.error(`Gagal memproses file: ${error.message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error("Format file tidak didukung. Gunakan CSV atau Excel (.xlsx/.xls)")
      return
    }

    setFile(selectedFile)
    parseAndValidateFile(selectedFile)
  }

  const downloadTemplate = () => {
    const headers = [
      "Nama Lengkap *",
      "NIP",
      "Jenis Kelamin",
      "No Telepon",
      "Email",
      "Status Kepegawaian *",
      "Pendidikan Terakhir",
      "Bidang Studi",
      "Nama Bank",
      "No Rekening",
      "Atas Nama Rekening"
    ]
    
    const sampleData = [
      ["Budi Santoso, S.Pd", "198001012010011001", "L", "08123456789", "budi@example.com", "GTY", "S1 Pendidikan", "Guru Matematika", "BCA", "1234567890", "Budi Santoso"],
      ["Siti Aminah, M.Pd", "198502022012012002", "P", "08987654321", "siti@example.com", "GTY", "S2 Pendidikan", "Guru Bahasa Indonesia", "Mandiri", "0987654321", "Siti Aminah"]
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])

    const colWidths = headers.map(h => ({ wch: h.length + 5 }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "Template Guru")
    
    const refHeaders = ["Status Kepegawaian", "Keterangan"]
    const refData = [
      ["GTY", "Guru Tetap Yayasan"],
      ["GTT", "Guru Tidak Tetap"],
      ["PNS", "Pegawai Negeri Sipil"],
      ["DPK", "Pegawai Diperbantukan"],
      ["PPPK", "Pegawai Pemerintah dengan Perjanjian Kerja"],
      ["Honor", "Guru / Pegawai Honorer lepas"],
      ["Staf TU", "Staf Tata Usaha"],
      ["Satpam", "Petugas Keamanan"],
      ["OB", "Petugas Kebersihan / Penjaga Sekolah"]
    ]
    const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refData])
    wsRef['!cols'] = [{wch: 25}, {wch: 40}]
    XLSX.utils.book_append_sheet(wb, wsRef, "Referensi Status")

    XLSX.writeFile(wb, "Template_Import_Guru.xlsx")
  }

  const handleImport = async () => {
    if (previewRows.length === 0) return
    if (!selectedUnit) {
      toast.error("Unit Tujuan belum dipilih!")
      return
    }

    setIsProcessing(true)

    try {
      const validRows = previewRows.filter(r => r.status === 'valid').map(r => r.rawRow)
      
      const formData = new FormData()
      formData.append("data", JSON.stringify(validRows))
      formData.append("unitId", selectedUnit)

      const response = await fetch('/api/import-guru', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat import')
      }

      setResult(data)
      setCurrentStep(3)
      if (data.success > 0) {
        toast.success(`Berhasil mengimpor ${data.success} data guru!`)
        onSuccess()
        router.refresh()
      } else {
        toast.error("Tidak ada data yang berhasil diimpor.")
      }

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-primary text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md shrink-0 shadow-inner">
              <FileSpreadsheet size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide">Wizard Impor Guru (3-Step)</h2>
              <p className="text-xs text-gray-300 font-medium">Impor data massal via Excel dengan pratinjau dan validasi otomatis.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
            <span className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${currentStep === 1 ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span> Unggah
            </span>
            <ArrowRight size={12} className="text-gray-500" />
            <span className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${currentStep === 2 ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span> Pratinjau
            </span>
            <ArrowRight size={12} className="text-gray-500" />
            <span className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${currentStep === 3 ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span> Selesai
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                      <Download size={18} className="text-blue-600" />
                      Langkah 1: Gunakan Template Excel Resmi
                    </h3>
                    <p className="text-xs text-blue-800/80 leading-relaxed max-w-xl">
                      Template terbaru memiliki 2 Sheet. Silakan baca Sheet 2 (Referensi) untuk melihat penulisan baku 'Status Kepegawaian' yang tidak boleh salah ketik (contoh: GTY, PNS). <strong>Jika kolom ini dikosongkan pada Excel, sistem otomatis menetapkannya sebagai GTY.</strong>
                    </p>
                  </div>
                  <button 
                    onClick={downloadTemplate}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/20 shrink-0"
                  >
                    <Download size={16} /> Unduh Template
                  </button>
                </div>
              </div>

              <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  Langkah 2: Tentukan Unit Sekolah & Unggah File
                </h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">1. Pilih Unit Sekolah <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold text-gray-900 shadow-xs transition-all"
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                    >
                      <option value="" disabled>-- Pilih Unit Sekolah --</option>
                      {schoolUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <UploadCloud size={18} className="text-primary" />
                  Langkah 3: Unggah File Excel (.xlsx / .xls) atau .csv
                </h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-primary/80 rounded-2xl p-8 sm:p-10 text-center bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group shadow-xs"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-primary transition-colors">
                    <div className="w-16 h-16 bg-white group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-all shadow-md border border-gray-200 group-hover:border-primary/20 group-hover:scale-105">
                      <UploadCloud size={32} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 group-hover:text-primary text-base">Klik area ini untuk memilih file Excel/CSV</p>
                      <p className="text-xs text-gray-500 mt-1">Mendukung format .xlsx, .xls, atau .csv</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Eye className="text-primary" /> Pratinjau Data
                </h3>
                <div className="flex gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <CheckCircle2 size={16} /> {previewRows.filter(r => r.status === 'valid').length} Valid
                  </span>
                  {previewRows.filter(r => r.status === 'invalid').length > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                      <AlertTriangle size={16} /> {previewRows.filter(r => r.status === 'invalid').length} Bermasalah
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">No</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3">NIP</th>
                        <th className="p-3">L/P</th>
                        <th className="p-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className={row.status === 'invalid' ? 'bg-red-50/30' : 'hover:bg-slate-50'}>
                          <td className="p-3 text-center text-slate-500">{row.rowNum}</td>
                          <td className="p-3">
                            {row.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={12} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                <AlertCircle size={12} /> Error
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-700">{row.nama || '-'}</td>
                          <td className="p-3 text-slate-600">{row.nip || '-'}</td>
                          <td className="p-3 text-slate-600">{row.gender || '-'}</td>
                          <td className="p-3 text-xs text-red-600 max-w-xs truncate">
                            {row.errors.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-sm flex gap-3 shrink-0 items-start">
                <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Informasi Impor</p>
                  <p className="opacity-90 leading-relaxed">
                    Hanya baris dengan status <strong className="text-green-700">OK</strong> yang akan diimpor. Baris yang <strong>Error</strong> akan diabaikan. Pastikan kolom wajib (Nama Lengkap) telah diisi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && result && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-10">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Proses Selesai</h3>
              <p className="text-slate-600 mb-8 max-w-md">Data guru telah selesai diproses dan dimasukkan ke dalam sistem.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                <div className="bg-white border border-green-200 p-4 rounded-2xl shadow-sm">
                  <div className="text-3xl font-black text-green-600 mb-1">{result.success}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-green-800">Berhasil</div>
                </div>
                <div className={`bg-white border p-4 rounded-2xl shadow-sm ${result.failed > 0 ? 'border-red-200' : 'border-slate-200'}`}>
                  <div className={`text-3xl font-black mb-1 ${result.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{result.failed}</div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${result.failed > 0 ? 'text-red-800' : 'text-slate-500'}`}>Gagal</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="w-full max-w-2xl bg-white border border-red-100 rounded-2xl overflow-hidden text-left shadow-sm mb-6">
                  <div className="bg-red-50/50 px-4 py-3 border-b border-red-100">
                    <h4 className="font-semibold text-red-800 flex items-center gap-2">
                      <AlertTriangle size={16} /> Rincian Gagal
                    </h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-4">
                    <ul className="space-y-2 text-sm">
                      {result.errors.map((err, i) => (
                        <li key={i} className="flex gap-3 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm shrink-0">Baris {err.row}</span>
                          <span className="text-red-600">{err.msg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-none p-6 border-t border-slate-100 bg-white flex justify-between items-center rounded-b-3xl">
          {currentStep === 1 ? (
            <>
              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
            </>
          ) : currentStep === 2 ? (
            <>
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                <ArrowLeft size={18} /> Kembali
              </button>
              <button 
                onClick={handleImport}
                disabled={isProcessing || previewRows.filter(r => r.status === 'valid').length === 0}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                ) : (
                  <><ShieldCheck size={18} /> Mulai Impor Data</>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
              >
                Selesai & Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modalContent, document.body)
}
