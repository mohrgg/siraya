'use client'

import React, { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setGlobalContext } from '@/actions/app-context'
import { 
  X, ChevronLeft, ChevronRight, School, Users, 
  Layers, GraduationCap, Wallet, ArrowRight, CheckCircle2, AlertTriangle, LayoutDashboard 
} from 'lucide-react'
import Link from 'next/link'

export interface UnitAuditData {
  id?: string
  name: string
  total: number
  rombel: number
  guru: number
  kolektibilitas: number | null | string
  tagihanTotal?: number
  tagihanTerbayar?: number
  tagihanSisa?: number
  classes?: Array<{
    name: string
    total: number
    rombelList?: Array<{
      id?: string
      name: string
      total: number
    }>
  }>
}

interface UnitAuditSideDrawerProps {
  isOpen: boolean
  onClose: () => void
  unitDataList: UnitAuditData[]
  currentUnitIndex: number
  onSelectUnitIndex: (index: number) => void
}

export default function UnitAuditSideDrawer({
  isOpen,
  onClose,
  unitDataList,
  currentUnitIndex,
  onSelectUnitIndex
}: UnitAuditSideDrawerProps) {
  const router = useRouter()
  const [isSyncing, startSync] = useTransition()

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !unitDataList || unitDataList.length === 0) return null

  const activeUnit = unitDataList[currentUnitIndex] || unitDataList[0]
  const hasPrev = currentUnitIndex > 0
  const hasNext = currentUnitIndex < unitDataList.length - 1

  const handleOpenBukuPiutang = (unitId?: string) => {
    if (!unitId) {
      window.location.href = '/rekapitulasi-tunggakan'
      return
    }
    startSync(async () => {
      await setGlobalContext(unitId, "")
      window.location.href = `/rekapitulasi-tunggakan?unitId=${unitId}`
    })
  }

  const handleOpenDashboardUnit = (unitId?: string) => {
    if (!unitId) return
    startSync(async () => {
      await setGlobalContext(unitId, "")
      window.location.href = `/?tab=unit&unitId=${unitId}`
    })
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  const kolektibilitasVal = typeof activeUnit.kolektibilitas === 'number' ? activeUnit.kolektibilitas : 0
  const isSehat = kolektibilitasVal >= 80
  const isKritis = typeof activeUnit.kolektibilitas === 'number' && activeUnit.kolektibilitas < 50
  const avgSiswaPerRombel = activeUnit.rombel > 0 ? Math.round(activeUnit.total / activeUnit.rombel) : 0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between transform transition-all duration-300 ease-in-out">
          
          {/* Header Panel */}
          <div className="p-6 border-b border-slate-200/80 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {/* Linear Navigation Controls */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => onSelectUnitIndex(currentUnitIndex - 1)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Unit Sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  Unit {currentUnitIndex + 1} dari {unitDataList.length}
                </span>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => onSelectUnitIndex(currentUnitIndex + 1)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Unit Berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup Panel Audit (ESC)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Unit Identity */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#065f32]/10 text-[#065f32] flex items-center justify-center shrink-0 border border-[#065f32]/20">
                  <School size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Unit Sekolah Binaan</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSehat 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isKritis
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {isSehat ? 'Kolektibilitas Sehat' : isKritis ? 'Audit Kritis' : 'Perlu Atensi'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{activeUnit.name}</h2>
                </div>
              </div>
            </div>

            {/* 4 Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{formatNumber(activeUnit.total)}</span>
                <span className="text-[10px] text-slate-500">{avgSiswaPerRombel} siswa/rombel</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rombel</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{formatNumber(activeUnit.rombel)}</span>
                <span className="text-[10px] text-slate-500">Kelas belajar</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pendidik</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{formatNumber(activeUnit.guru)}</span>
                <span className="text-[10px] text-slate-500">Guru & staf</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kolektibilitas</span>
                <span className={`text-lg font-black mt-0.5 block ${isSehat ? 'text-[#065f32]' : isKritis ? 'text-rose-600' : 'text-amber-600'}`}>
                  {activeUnit.kolektibilitas === null || activeUnit.kolektibilitas === undefined || activeUnit.kolektibilitas === 'N/A' ? '-' : `${activeUnit.kolektibilitas}%`}
                </span>
                <span className="text-[10px] text-slate-500">Efektivitas SPP</span>
              </div>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Section 1: Sebaran Tingkat & Rombongan Belajar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-[#065f32]" />
                    Sebaran Siswa per Tingkat & Rombel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Struktur daya tampung dan sebaran rombongan belajar aktif.</p>
                </div>
                <Link
                  href="/kelas"
                  className="text-xs font-semibold text-[#065f32] hover:underline inline-flex items-center gap-1"
                >
                  Buka Modul Rombel <ArrowRight size={12} />
                </Link>
              </div>

              {activeUnit.classes && activeUnit.classes.length > 0 ? (
                <div className="space-y-3">
                  {activeUnit.classes.map((cls, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{cls.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                          {formatNumber(cls.total)} Siswa
                        </span>
                      </div>

                      {/* Rombel Sub-Classes List */}
                      {cls.rombelList && cls.rombelList.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200/60">
                          {cls.rombelList.map((r, rIdx) => (
                            <span 
                              key={rIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#065f32]" />
                              <strong>{r.name}</strong>
                              <span className="text-slate-400 text-[10px]">({r.total} murid)</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic mt-1 block">Belum ada rincian sub-kelas.</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <GraduationCap size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Belum ada sebaran rombel terdaftar</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Data tingkat atau rombel belum dimasukkan ke sistem.</p>
                </div>
              )}
            </div>

            {/* Section 2: Ringkasan Finansial & Tagihan SPP Unit */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Wallet size={16} className="text-[#065f32]" />
                    Audit Ringkasan SPP & Piutang
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Realisasi pelunasan tagihan kesiswaan pada unit ini.</p>
                </div>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => handleOpenBukuPiutang(activeUnit?.id)}
                  className="text-xs font-semibold text-[#065f32] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Buku Piutang <ArrowRight size={12} />
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Realisasi Penerimaan:</span>
                  <span className="font-bold text-[#065f32]">{formatCurrency(activeUnit.tagihanTerbayar || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sisa Piutang Berjalan:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(activeUnit.tagihanSisa || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-semibold">
                  <span className="text-slate-700">Total Nilai Tagihan:</span>
                  <span className="text-slate-900">{formatCurrency(activeUnit.tagihanTotal || 0)}</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] mb-1 font-bold">
                    <span className="text-slate-600">Efektivitas SPP</span>
                    <span className={isSehat ? 'text-[#065f32]' : isKritis ? 'text-rose-600' : 'text-amber-600'}>
                      {activeUnit.kolektibilitas === null || activeUnit.kolektibilitas === undefined || activeUnit.kolektibilitas === 'N/A' ? 'N/A' : `${activeUnit.kolektibilitas}%`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSehat ? 'bg-[#065f32]' : isKritis ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, kolektibilitasVal))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Hub */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors min-h-[44px]"
            >
              Tutup Panel
            </button>
            {activeUnit?.id && (
              <button
                type="button"
                onClick={() => handleOpenDashboardUnit(activeUnit.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#065f32]/30 text-[#065f32] text-xs font-bold transition-colors shadow-2xs min-h-[44px]"
              >
                <LayoutDashboard size={14} />
                Buka Dashboard Unit
              </button>
            )}
            <Link
              href="/kelas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#065f32] hover:bg-[#054d28] text-white text-xs font-bold transition-colors shadow-xs min-h-[44px]"
            >
              Audit Rombel di Modul Kelas <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
