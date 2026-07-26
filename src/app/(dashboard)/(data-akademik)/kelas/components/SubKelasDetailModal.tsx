"use client"

import { useState, useEffect } from "react"
import { X, Users, GraduationCap, Building, Award, Calendar, User, Edit2, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getSiswaPaginated } from "@/actions/siswa"

interface SubKelasDetailModalProps {
  isOpen: boolean
  onClose: () => void
  subKelas: any
  isReadOnly?: boolean
  onEdit?: (subKelas: any) => void
  onViewStudent?: (student: any) => void
}

export default function SubKelasDetailModal({
  isOpen,
  onClose,
  subKelas,
  isReadOnly = false,
  onEdit,
  onViewStudent
}: SubKelasDetailModalProps) {
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && subKelas?.id) {
      setIsLoading(true)
      getSiswaPaginated({
        subKelasId: subKelas.id,
        page: 1,
        limit: 200,
        statusFilter: "AKTIF"
      })
        .then((res) => {
          setStudents(res.data || [])
        })
        .catch(() => {
          setStudents([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setStudents([])
    }
  }, [isOpen, subKelas])

  if (!isOpen || !subKelas) return null

  const maleCount = students.filter(s => s.gender?.toLowerCase().includes("laki")).length
  const femaleCount = students.filter(s => s.gender?.toLowerCase().includes("perempuan")).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                  {subKelas.unitSekolah?.name || "Unit Sekolah"}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs font-semibold text-gray-500">
                  Tahun Akademik: {subKelas.tahunAkademik?.name || "Aktif"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mt-0.5">
                Rombel: {subKelas.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Tingkat {subKelas.tingkat?.name || "-"} {subKelas.jurusan?.name ? `• Jurusan ${subKelas.jurusan.name}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Summary Mini Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Siswa Aktif</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{isLoading ? "-" : students.length}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Siswa Laki-Laki</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{isLoading ? "-" : maleCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                L
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Siswa Perempuan</p>
                <p className="text-2xl font-black text-pink-600 mt-1">{isLoading ? "-" : femaleCount}</p>
              </div>
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center font-bold">
                P
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                Daftar Siswa Dalam Rombel Ini
              </h3>
              <span className="text-xs text-gray-500 font-semibold">
                Menampilkan siswa berstatus AKTIF
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 border-b border-gray-200 z-10">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">No</th>
                    <th className="py-2.5 px-4">NISN / NIS</th>
                    <th className="py-2.5 px-4">Nama Lengkap</th>
                    <th className="py-2.5 px-4">L/P</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isLoading && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-4 text-center"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                          <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {!isLoading && students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-gray-400 text-sm italic">
                        Belum ada siswa yang ditempatkan di rombel ini.
                      </td>
                    </tr>
                  )}

                  {!isLoading && students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-center text-gray-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-gray-600">
                        <span className="font-bold text-gray-800">{s.nisn || "-"}</span> / {s.nis}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={12} className="text-gray-400" />
                          )}
                        </div>
                        {s.name}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.gender?.toLowerCase().includes("laki") ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                          {s.gender?.toLowerCase().includes("laki") ? "Laki-laki" : "Perempuan"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {onViewStudent && (
                          <button
                            onClick={() => {
                              onClose()
                              onViewStudent(s)
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
                          >
                            <Info size={14} /> Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Mode: <span className="font-bold text-gray-700">{isReadOnly ? "Read-Only (Kepala Sekolah)" : "Administrator / TU"}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose()
                  onEdit(subKelas)
                }}
                className="gap-2"
              >
                <Edit2 size={16} /> Edit Rombel Ini
              </Button>
            )}
            <Button variant="primary" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
