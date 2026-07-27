"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, UploadCloud, AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, ArrowLeft, ArrowRight, Eye, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react"
import Papa from "papaparse"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

interface ImportMuridModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  schoolUnits: any[]
  classrooms: any[]
}

interface PreviewRow {
  rowNum: number
  nis: string
  nama: string
  gender: string
  tglLahir: string
  ortuTelp: string
  targetSubKelasId: string
  targetSubKelasName: string
  status: 'valid' | 'invalid'
  errors: string[]
  rawRow: any
}

export default function ImportMuridModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  schoolUnits,
  classrooms 
}: ImportMuridModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [selectedSubKelas, setSelectedSubKelas] = useState("")
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

  const filteredClassrooms = classrooms.filter(c => c.unitSekolahId === selectedUnit)

  const parseAndValidateFile = async (selectedFile: File, fallbackSubKelasId: string) => {
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
        const nis = (row["NIS *"] || row["NIS"] || "").toString().trim()
        const nama = (row["Nama Lengkap *"] || row["Nama Lengkap"] || "").toString().trim()
        const gender = (row["Jenis Kelamin"] || "").toString().trim()
        const tglLahir = (row["Tanggal Lahir (YYYY-MM-DD)"] || "").toString().trim()
        const ortuTelp = (row["No Telepon Ortu"] || "").toString().trim()
        const targetSubKelasId = (row["ID Sub Kelas (Opsional)"] || row["ID Sub Kelas"] || fallbackSubKelasId || "").toString().trim()

        const errors: string[] = []
        if (!nis) errors.push("NIS wajib diisi")
        if (!nama) errors.push("Nama Lengkap wajib diisi")
        if (!targetSubKelasId) errors.push("Rombel tujuan belum ditentukan")

        const targetClassObj = classrooms.find(c => c.id === targetSubKelasId)
        const targetSubKelasName = targetClassObj ? targetClassObj.name : (targetSubKelasId ? "ID Custom / Lainnya" : "-")

        return {
          rowNum,
          nis,
          nama,
          gender,
          tglLahir,
          ortuTelp,
          targetSubKelasId,
          targetSubKelasName,
          status: errors.length === 0 ? 'valid' : 'invalid',
          errors,
          rawRow: row
        }
      })

      setPreviewRows(rows)
      setCurrentStep(2)
      toast.success(`Berhasil memuat ${rows.length} baris data`)
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file melebihi batas maksimal 5MB")
        return
      }
      if (!selectedUnit) {
        toast.error("Harap pilih Unit Sekolah terlebih dahulu")
        return
      }
      setFile(selectedFile)
      await parseAndValidateFile(selectedFile, selectedSubKelas)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (!droppedFile.name.match(/\.(csv|xlsx|xls)$/)) {
        toast.error("Format file tidak didukung. Harap gunakan .csv, .xlsx, atau .xls")
        return
      }
      if (!selectedUnit) {
        toast.error("Harap pilih Unit Sekolah terlebih dahulu")
        return
      }
      setFile(droppedFile)
      await parseAndValidateFile(droppedFile, selectedSubKelas)
    }
  }

  const handleExecuteImport = async () => {
    const validRows = previewRows.filter(r => r.status === 'valid').map(r => r.rawRow)
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimpor.")
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify(validRows))
      formData.append('unitId', selectedUnit)
      formData.append('subKelasId', selectedSubKelas)

      const response = await fetch('/api/import-murid', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengimpor data")
      }

      setResult(data)
      setCurrentStep(3)
      if (data.success > 0) {
        toast.success(`Berhasil mengimpor ${data.success} murid`)
        onSuccess()
      } else {
        toast.error("Tidak ada data murid baru yang disimpan.")
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const validCount = previewRows.filter(r => r.status === 'valid').length
  const invalidCount = previewRows.filter(r => r.status === 'invalid').length

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 overflow-hidden">
        
        <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-primary text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md shrink-0 shadow-inner">
              <FileSpreadsheet size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide">Wizard Impor Murid (3-Step)</h2>
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
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                      <Download size={18} className="text-blue-600" />
                      Langkah 1: Gunakan Template Excel Resmi (2 Sheet)
                    </h3>
                    <p className="text-xs text-blue-800/80 leading-relaxed max-w-xl">
                      Template terbaru memiliki <b>2 Sheet</b>: Sheet 1 untuk pengisian data siswa dan Sheet 2 memuat daftar <b>Referensi ID Rombel</b> untuk memudahkan pemetaan kelas langsung dari Excel.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      import("@/lib/excel").then((mod) => mod.downloadSiswaTemplate(schoolUnits, classrooms))
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/20 shrink-0"
                  >
                    <Download size={16} /> Unduh Template 2-Sheet
                  </button>
                </div>
              </div>

              <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  Langkah 2: Tentukan Unit & Rombel Tujuan Default
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">1. Pilih Unit Sekolah <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold text-gray-900 shadow-xs transition-all"
                      value={selectedUnit}
                      onChange={(e) => { setSelectedUnit(e.target.value); setSelectedSubKelas("") }}
                    >
                      <option value="" disabled>-- Pilih Unit Sekolah --</option>
                      {schoolUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">2. Rombel / Kelas Tujuan Default <span className="text-gray-400 font-normal">(Opsional)</span></label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold text-gray-900 shadow-xs transition-all disabled:opacity-50 disabled:bg-gray-100"
                      value={selectedSubKelas}
                      onChange={(e) => setSelectedSubKelas(e.target.value)}
                      disabled={!selectedUnit}
                    >
                      <option value="">-- Gunakan ID di File Excel / Pilih Default --</option>
                      {filteredClassrooms.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">Kelas ini akan digunakan jika kolom <i>ID Sub Kelas</i> pada baris Excel dikosongkan.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <UploadCloud size={18} className="text-primary" />
                  Langkah 3: Unggah File Excel (.xlsx / .xls) atau .csv
                </h3>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
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
                      <p className="font-black text-gray-800 group-hover:text-primary text-base">Klik atau seret file Excel/CSV ke area ini</p>
                      <p className="text-xs text-gray-500 mt-1">Mendukung format .xlsx, .xls, atau .csv (Maksimal 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Total Terbaca</span>
                  <p className="text-2xl font-black text-gray-900 mt-1">{previewRows.length} <span className="text-xs font-normal text-gray-400">baris</span></p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-emerald-700 uppercase flex items-center justify-center gap-1"><CheckCircle2 size={14}/> Siap Diimpor</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{validCount} <span className="text-xs font-normal text-emerald-500">valid</span></p>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-red-700 uppercase flex items-center justify-center gap-1"><AlertTriangle size={14}/> Bermasalah</span>
                  <p className="text-2xl font-black text-red-600 mt-1">{invalidCount} <span className="text-xs font-normal text-red-500">invalid</span></p>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Terdapat {invalidCount} baris data dengan kesalahan</p>
                    <p className="mt-0.5 text-amber-800">Baris yang ditandai merah tidak akan diimpor. Anda dapat melanjutkan impor hanya untuk data yang valid, atau kembali untuk mengunggah ulang file yang telah diperbaiki.</p>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Eye size={16} className="text-primary" /> Tabel Pratinjau & Hasil Validasi Lokal
                  </h3>
                  <span className="text-xs font-mono text-gray-500">Menampilkan maks {previewRows.length} baris</span>
                </div>
                <div className="max-h-[340px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/80 text-gray-600 font-bold sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="py-3 px-4 border-b border-gray-200 w-12 text-center">Baris</th>
                        <th className="py-3 px-4 border-b border-gray-200">NIS / NISN</th>
                        <th className="py-3 px-4 border-b border-gray-200">Nama Lengkap</th>
                        <th className="py-3 px-4 border-b border-gray-200">Gender / Tgl Lahir</th>
                        <th className="py-3 px-4 border-b border-gray-200">Rombel Tujuan</th>
                        <th className="py-3 px-4 border-b border-gray-200">Status Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((row) => (
                        <tr 
                          key={row.rowNum} 
                          className={`transition-colors ${row.status === 'invalid' ? 'bg-red-50/70 hover:bg-red-100/70' : 'hover:bg-gray-50/80'}`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-gray-500 text-center">{row.rowNum}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-900 font-mono">{row.nis || <span className="text-red-600 italic">Kosong</span>}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{row.rawRow["NISN"] || "-"}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {row.nama || <span className="text-red-600 italic">Kosong</span>}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <p>{row.gender || "-"}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{row.tglLahir || "-"}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-[11px] font-bold">
                              {row.targetSubKelasName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {row.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                <CheckCircle2 size={12} /> Valid
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {row.errors.map((err, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[11px] block w-fit">
                                    <AlertCircle size={12} /> {err}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 border-2 border-emerald-200">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900">Proses Impor Selesai!</h3>
                <p className="text-sm text-gray-600">Berikut adalah laporan hasil pemrosesan data ke database.</p>
              </div>
              <div className="flex gap-4 max-w-lg mx-auto">
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-xs">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Berhasil Disimpan</p>
                  <p className="text-4xl font-black text-emerald-600">{result.success}</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">Siswa baru aktif</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-xs">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Gagal / Dilewati</p>
                  <p className="text-4xl font-black text-red-600">{result.failed}</p>
                  <p className="text-[11px] text-red-700 mt-1 font-medium">Duplikat / Error</p>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="border border-red-200 rounded-2xl overflow-hidden max-w-2xl mx-auto text-left shadow-xs">
                  <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-red-900 uppercase flex items-center gap-2">
                      <AlertCircle size={15} className="text-red-600" /> Detail Keterangan Gagal ({result.errors.length})
                    </span>
                  </div>
                  <div className="bg-white max-h-[180px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-gray-100">
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-red-50/40">
                            <td className="px-4 py-2.5 font-bold text-gray-700 font-mono w-24">Baris {err.row}</td>
                            <td className="px-4 py-2.5 text-red-600 font-medium">{err.msg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          {currentStep === 1 && (
            <>
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <HelpCircle size={15} className="text-gray-400" /> Butuh bantuan pengisian? Lihat panduan di Sheet 2 template.
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 rounded-xl text-sm font-bold transition-all"
              >
                Batal
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                onClick={() => setCurrentStep(1)}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <ArrowLeft size={16} /> Kembali & Pilih File Lain
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 rounded-xl text-sm font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={validCount === 0 || isProcessing}
                  className={`px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-black shadow-md shadow-primary/20 flex items-center gap-2 transition-all
                    ${validCount === 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                >
                  {isProcessing ? (
                    <><Loader2 size={16} className="animate-spin" /> Menyimpan ke Database...</>
                  ) : (
                    <>Mulai Impor ({validCount} Data Valid) <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-black shadow-lg shadow-primary/25 transition-all"
              >
                Tutup & Lihat Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
