"use client"
import { useState, useRef } from "react"
import { X, UploadCloud, AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import Papa from "papaparse"

import * as XLSX from "xlsx"

interface ImportMuridModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  schoolUnits: any[]
  classrooms: any[]
}

export default function ImportMuridModal({ 
  isOpen, onClose, onSuccess, schoolUnits, classrooms 
}: ImportMuridModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: number, failed: number, errors: { row: number, msg: string }[] } | null>(null)
  
  const [selectedUnit, setSelectedUnit] = useState<string>(schoolUnits[0]?.id || "")
  const [selectedSubKelas, setSelectedSubKelas] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const filteredClassrooms = classrooms.filter((c: any) => c.unitSekolahId === selectedUnit)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile)
        setResult(null)
      } else {
        alert("Mohon unggah file dengan format .csv, .xlsx, atau .xls")
      }
    }
  }

  const handleImport = async () => {
    if (!file || !selectedUnit || !selectedSubKelas) return

    setIsProcessing(true)
    setResult(null)

    try {
      let jsonData: any[] = []

      if (file.name.endsWith('.csv')) {
        jsonData = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error: any) => reject(error)
          })
        })
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      }

      const formData = new FormData()
      formData.append('data', JSON.stringify(jsonData))
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
      if (data.success > 0) {
        onSuccess() // Refresh table
      }
    } catch (error: any) {
      alert("Terjadi kesalahan: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-text-main">Impor Data Murid (Excel)</h2>
              <p className="text-xs font-medium text-text-muted mt-0.5">Unggah CSV untuk bulk insert murid.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main hover:bg-gray-100 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {!result ? (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <h3 className="font-bold text-sm text-blue-900 mb-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs">1</span> Download Template</h3>
                <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
                  Gunakan template CSV resmi kami. Kolom dengan tanda bintang merah (<b>*</b>) pada file CSV wajib diisi. 
                  Untuk <b>Jenis Kelamin</b> bisa diisi dengan awalan <b>L</b> (Laki-laki) atau <b>P</b> (Perempuan).
                </p>
                <a href="/templates/template_impor_murid.csv" download className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors shadow-sm">
                  <Download size={14} /> Download template_impor_murid.csv
                </a>
              </div>

              {/* Step 2 */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                <h3 className="font-bold text-sm text-purple-900 mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs">2</span> Pilih Unit & Rombel Tujuan</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-purple-800 mb-1.5">Unit Sekolah</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm font-medium"
                      value={selectedUnit}
                      onChange={(e) => { setSelectedUnit(e.target.value); setSelectedSubKelas("") }}
                    >
                      <option value="" disabled>-- Pilih Unit --</option>
                      {schoolUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-purple-800 mb-1.5">Kelas Tujuan</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm font-medium disabled:opacity-50"
                      value={selectedSubKelas}
                      onChange={(e) => setSelectedSubKelas(e.target.value)}
                      disabled={!selectedUnit}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {filteredClassrooms.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs">3</span> Unggah File CSV / Excel</h3>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-600">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="font-bold">{file.name}</p>
                        <p className="text-xs text-emerald-600/70">{(file.size / 1024).toFixed(2)} KB • Siap diimpor</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 hover:underline">Klik untuk mengganti file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-primary transition-colors">
                      <div className="w-12 h-12 bg-gray-100 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Klik atau drag & drop file CSV/Excel di sini</p>
                        <p className="text-xs opacity-70">Maksimal 5MB (.csv, .xlsx, .xls)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-emerald-700 mb-1">Berhasil</p>
                  <p className="text-3xl font-black text-emerald-600">{result.success}</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-red-700 mb-1">Gagal / Dilewati</p>
                  <p className="text-3xl font-black text-red-600">{result.failed}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <h4 className="font-bold text-xs text-red-800">Detail Error</h4>
                  </div>
                  <div className="bg-white max-h-[200px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/50 text-text-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-semibold w-24">Baris ke-</th>
                          <th className="px-4 py-2 font-semibold">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-bold text-gray-700">Baris {err.row}</td>
                            <td className="px-4 py-2 text-red-600 font-medium">{err.msg}</td>
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

        {/* Footer */}
        <div className="p-5 border-t border-border bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
          {result ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-hover transition-colors"
            >
              Selesai
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-5 py-2.5 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={!file || isProcessing}
                className={`px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all
                  ${!file || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
              >
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : "Mulai Impor"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
