"use client"

import { useState } from "react"
import { X, User, Users, HeartPulse, GraduationCap, MapPin, Edit2, Phone, Mail, Calendar, Award } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface MuridDetailModalProps {
  isOpen: boolean
  onClose: () => void
  murid: any
  isReadOnly?: boolean
  onEdit?: (murid: any) => void
}

const TABS = [
  { id: "utama", label: "Informasi Utama", icon: GraduationCap },
  { id: "pribadi", label: "Identitas Pribadi", icon: User },
  { id: "keluarga", label: "Data Keluarga", icon: Users },
  { id: "pendidikan", label: "Pendidikan & Fisik", icon: MapPin },
  { id: "kesehatan", label: "Riwayat Kesehatan", icon: HeartPulse },
]

export default function MuridDetailModal({ isOpen, onClose, murid, isReadOnly = false, onEdit }: MuridDetailModalProps) {
  const [activeTab, setActiveTab] = useState("utama")

  if (!isOpen || !murid) return null

  const getStatusBadge = (status: string) => {
    if (status === "AKTIF") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "LULUS") return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "PINDAH") return "bg-orange-100 text-orange-700 border-orange-200";
    if (status === "CUTI") return "bg-gray-100 text-gray-700 border-gray-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  }

  const currentRombel = murid.riwayatKelas?.[0]?.subKelas?.name || murid.subKelas?.name || "Belum ada kelas"
  const unitName = murid.unitSekolah?.name || "Unit Sekolah"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center shadow-md shrink-0 backdrop-blur-md">
              {murid.photoUrl ? (
                <img src={murid.photoUrl} alt={murid.name} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-white/80" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/20 text-white border border-white/30">
                  {unitName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-amber-950">
                  Rombel: {currentRombel}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getStatusBadge(murid.status)}`}>
                  {murid.status || "AKTIF"}
                </span>
                {murid.isScholarship && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-500 text-white flex items-center gap-1">
                    <Award size={12} /> Beasiswa
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{murid.name}</h2>
              <p className="text-xs text-blue-100 mt-0.5 font-mono">
                NIS: <span className="font-bold text-white">{murid.nis}</span> {murid.nisn ? `• NISN: ${murid.nisn}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 gap-2 bg-gray-50/50 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary bg-white shadow-sm rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <Icon size={16} className={isActive ? "text-primary" : "text-gray-400"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-sm">
          {activeTab === "utama" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Identitas Akademik</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nomor Induk Siswa (NIS)</label>
                    <p className="font-mono font-bold text-gray-800 text-base mt-0.5">{murid.nis || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">NISN</label>
                    <p className="font-mono font-bold text-gray-800 text-base mt-0.5">{murid.nisn || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Unit Sekolah</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{unitName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Rombel Saat Ini</label>
                    <p className="font-semibold text-primary mt-0.5">{currentRombel}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Status Siswa</label>
                    <p className="font-bold text-gray-800 mt-0.5">{murid.status || "AKTIF"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Penerima Beasiswa</label>
                    <p className="font-bold text-gray-800 mt-0.5">{murid.isScholarship ? "Ya (Aktif)" : "Tidak"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Akun & Pendaftaran</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Username Akun</label>
                    <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.username || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">No. Formulir / Daftar</label>
                    <p className="font-mono font-bold text-gray-800 mt-0.5">{murid.formNo || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Tanggal Terdaftar</label>
                    <p className="font-medium text-gray-700 mt-0.5">
                      {murid.createdAt ? new Date(murid.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pribadi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Biodata Diri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nama Lengkap</label>
                    <p className="font-bold text-gray-800 text-base mt-0.5">{murid.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nama Panggilan</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.nickname || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">NIK / No. KTP</label>
                    <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.nik || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Tempat Lahir</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.birthPlace || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Tanggal Lahir</label>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {murid.birthDate ? new Date(murid.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Jenis Kelamin</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.gender || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Agama</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.religion || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Anak Ke-</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.childOrder || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Jumlah Saudara</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.siblingCount || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Kontak & Alamat</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">No. Telepon / WhatsApp</label>
                    <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Alamat Email</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Alamat Tempat Tinggal</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.address || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">RT / RW</label>
                    <p className="font-mono font-semibold text-gray-800 mt-0.5">
                      {murid.rt ? `${murid.rt} / ${murid.rw || "-"}` : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Kelurahan / Desa</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.village || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Kecamatan</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.district || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Kode Pos</label>
                    <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.postalCode || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "keluarga" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Ayah */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3">
                  <h3 className="font-extrabold text-blue-700 text-sm uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <User size={16} /> Data Ayah Kandung
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="text-gray-400 font-semibold uppercase">Nama Lengkap Ayah</label>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.fatherName || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">NIK Ayah</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.fatherNik || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Tahun Lahir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherBirthYear || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Pendidikan Terakhir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherEducation || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Pekerjaan</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.fatherOccupation || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-400 font-semibold uppercase">Rentang Penghasilan</label>
                      <p className="font-semibold text-emerald-700 mt-0.5">{murid.fatherIncome || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Data Ibu */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3">
                  <h3 className="font-extrabold text-pink-600 text-sm uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <User size={16} /> Data Ibu Kandung
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="text-gray-400 font-semibold uppercase">Nama Lengkap Ibu</label>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.motherName || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">NIK Ibu</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.motherNik || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Tahun Lahir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.motherBirthYear || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Pendidikan Terakhir</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.motherEducation || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Pekerjaan</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.motherOccupation || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-400 font-semibold uppercase">Rentang Penghasilan</label>
                      <p className="font-semibold text-emerald-700 mt-0.5">{murid.motherIncome || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Wali & Kontak Darurat */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-blue-200 pb-2 mb-3">
                    Data Wali (Jika Ada)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="text-gray-400 font-semibold uppercase">Nama Wali</label>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{murid.guardianName || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">Pekerjaan Wali</label>
                      <p className="font-semibold text-gray-800 mt-0.5">{murid.guardianOccupation || "-"}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">No. Telepon Wali</label>
                      <p className="font-mono font-semibold text-gray-800 mt-0.5">{murid.guardianPhone || "-"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-blue-200 pb-2 mb-3">
                    Kontak Utama Orang Tua
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-400 font-semibold uppercase">WhatsApp / No. HP Orang Tua</label>
                      <p className="font-mono font-black text-blue-700 text-lg mt-0.5 flex items-center gap-2">
                        <Phone size={16} /> {murid.parentPhone || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pendidikan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Pendidikan Sebelumnya</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nama Sekolah Asal (SMP/SD/TK)</label>
                    <p className="font-bold text-gray-800 text-base mt-0.5">{murid.previousSchool || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 text-base">Data Periodik & Fisik</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Tinggi Badan</label>
                    <p className="font-bold text-gray-800 text-base mt-0.5">{murid.height ? `${murid.height} cm` : "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Berat Badan</label>
                    <p className="font-bold text-gray-800 text-base mt-0.5">{murid.weight ? `${murid.weight} kg` : "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Lingkar Kepala</label>
                    <p className="font-bold text-gray-800 text-base mt-0.5">{murid.headSize ? `${murid.headSize} cm` : "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Jarak ke Sekolah</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.distanceToSchool || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Waktu Tempuh</label>
                    <p className="font-semibold text-gray-800 mt-0.5">{murid.travelTime || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "kesehatan" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-rose-50/50 p-6 rounded-xl border border-rose-100 space-y-4">
                <h3 className="font-extrabold text-rose-700 text-base uppercase tracking-wide flex items-center gap-2">
                  <HeartPulse size={20} /> Data Medis & Kesehatan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Golongan Darah</label>
                    <p className="font-black text-rose-600 text-2xl mt-1">{murid.bloodType || "-"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Riwayat Penyakit / Keluhan Kesehatan</label>
                    <p className="font-medium text-gray-800 mt-1 bg-white p-3 rounded-lg border border-rose-100">
                      {murid.medicalHistory || "Tidak ada riwayat penyakit atau keluhan kesehatan khusus."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                  onEdit(murid)
                }}
                className="gap-2 font-semibold"
              >
                <Edit2 size={16} /> Edit Data Murid Ini
              </Button>
            )}
            <Button variant="primary" onClick={onClose} className="px-6 font-bold">
              Tutup
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
