'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { setGlobalContext } from '@/actions/app-context'
import { 
  X, ChevronLeft, ChevronRight, School, Users, 
  Layers, GraduationCap, Wallet, ArrowRight, CheckCircle2, AlertTriangle, LayoutDashboard,
  Coins 
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
  kasMasuk?: number
  kasKeluar?: number
  saldoKas?: number
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when drawer is open
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

  if (!isOpen || !mounted || !unitDataList || unitDataList.length === 0) return null

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

  const handleOpenKasMasuk = (unitId?: string) => {
    if (!unitId) {
      window.location.href = '/kas-masuk'
      return
    }
    startSync(async () => {
      await setGlobalContext(unitId, "")
      window.location.href = `/kas-masuk?unitId=${unitId}`
    })
  }

  const handleOpenKasKeluar = (unitId?: string) => {
    if (!unitId) {
      window.location.href = '/kas-keluar'
      return
    }
    startSync(async () => {
      await setGlobalContext(unitId, "")
      window.location.href = `/kas-keluar?unitId=${unitId}`
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
  const formatCurrency = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`

  const kolektibilitasVal = typeof activeUnit.kolektibilitas === 'number' ? activeUnit.kolektibilitas : 0
  const isSehat = kolektibilitasVal >= 80
  const isKritis = typeof activeUnit.kolektibilitas === 'number' && activeUnit.kolektibilitas < 50
  const avgSiswaPerRombel = activeUnit.rombel > 0 ? Math.round(activeUnit.total / activeUnit.rombel) : 0

  return createPortal(
    <div className="fixed inset-0 z-[9990] overflow-hidden animate-in fade-in duration-200 touch-manipulation">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex h-[100dvh] max-h-[100dvh]">
        <div 
          className="w-full sm:max-w-2xl bg-surface shadow-2xl border-l border-border flex flex-col justify-between transform transition-all duration-300 ease-in-out h-full overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header Panel */}
          <div className="p-4 sm:p-6 short:py-2.5 short:px-4 border-b border-border bg-bg/50 flex flex-col gap-3 sm:gap-4 short:gap-1.5">
            <div className="flex items-center justify-between">
              {/* Linear Navigation Controls */}
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => onSelectUnitIndex(currentUnitIndex - 1)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Unit Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-text-main px-1.5">
                  Unit {currentUnitIndex + 1} dari {unitDataList.length}
                </span>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => onSelectUnitIndex(currentUnitIndex + 1)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Unit Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-bg transition-colors"
                title="Tutup Panel Audit (ESC)"
              >
                <X size={20} className="short:w-4 short:h-4" />
              </button>
            </div>

            {/* Unit Identity */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 short:w-8 short:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#065f32] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                  <School size={24} className="short:w-4 short:h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] short:text-[10px] font-bold tracking-wider uppercase text-text-muted">Unit Sekolah Binaan</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSehat 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : isKritis
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {isSehat ? 'Kolektibilitas Sehat' : isKritis ? 'Audit Kritis' : 'Perlu Atensi'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl short:text-base font-black text-text-main tracking-tight">{activeUnit.name}</h2>
                </div>
              </div>
            </div>

            {/* 4 Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 short:gap-1.5 pt-2 short:pt-0.5">
              <div className="p-3 short:p-1.5 bg-bg rounded-xl border border-border shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Siswa</span>
                <span className="text-lg short:text-sm font-black text-text-main mt-0.5 block">{formatNumber(activeUnit.total)}</span>
                <span className="text-[10px] text-text-muted">{avgSiswaPerRombel} siswa/rombel</span>
              </div>
              <div className="p-3 short:p-1.5 bg-bg rounded-xl border border-border shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Rombel</span>
                <span className="text-lg short:text-sm font-black text-text-main mt-0.5 block">{formatNumber(activeUnit.rombel)}</span>
                <span className="text-[10px] text-text-muted">Kelas belajar</span>
              </div>
              <div className="p-3 short:p-1.5 bg-bg rounded-xl border border-border shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Pendidik</span>
                <span className="text-lg short:text-sm font-black text-text-main mt-0.5 block">{formatNumber(activeUnit.guru)}</span>
                <span className="text-[10px] text-text-muted">Guru & staf</span>
              </div>
              <div className="p-3 short:p-1.5 bg-bg rounded-xl border border-border shadow-2xs">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Kolektibilitas</span>
                <span className={`text-lg short:text-sm font-black mt-0.5 block ${isSehat ? 'text-emerald-600 dark:text-emerald-400' : isKritis ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {activeUnit.kolektibilitas === null || activeUnit.kolektibilitas === undefined || activeUnit.kolektibilitas === 'N/A' ? '-' : `${activeUnit.kolektibilitas}%`}
                </span>
                <span className="text-[10px] text-text-muted">Efektivitas SPP</span>
              </div>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 short:p-3 space-y-4 sm:space-y-6 short:space-y-3">
            
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
                      className="p-4 rounded-xl border border-border bg-bg/50 hover:bg-bg transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-surface border border-border text-text-main font-black text-xs flex items-center justify-center shadow-2xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-text-main text-sm">{cls.name}</span>
                        </div>
                        <span className="text-xs font-black text-text-main bg-surface px-2.5 py-1 rounded-md border border-border shadow-2xs">
                          {formatNumber(cls.total)} Siswa
                        </span>
                      </div>

                      {/* Rombel Sub-Classes List */}
                      {cls.rombelList && cls.rombelList.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                          {cls.rombelList.map((r, rIdx) => (
                            <span 
                              key={rIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-text-main text-xs font-medium shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <strong>{r.name}</strong>
                              <span className="text-text-muted text-[10px]">({r.total} murid)</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic mt-1 block">Belum ada rincian sub-kelas.</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-bg rounded-xl border border-dashed border-border text-text-muted">
                  <GraduationCap size={28} className="mx-auto text-text-muted mb-2" />
                  <p className="text-xs font-medium text-text-main">Belum ada sebaran rombel terdaftar</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Data tingkat atau rombel belum dimasukkan ke sistem.</p>
                </div>
              )}
            </div>

            {/* Section 2: Ringkasan Finansial & Tagihan SPP Unit */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-text-main text-sm flex items-center gap-2">
                    <Wallet size={16} className="text-primary" />
                    Audit Ringkasan SPP & Piutang
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Realisasi pelunasan tagihan kesiswaan pada unit ini.</p>
                </div>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => handleOpenBukuPiutang(activeUnit?.id)}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Buku Piutang <ArrowRight size={12} />
                </button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Realisasi Penerimaan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(activeUnit.tagihanTerbayar || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Sisa Piutang Berjalan:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(activeUnit.tagihanSisa || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border font-semibold">
                  <span className="text-text-muted">Total Nilai Tagihan:</span>
                  <span className="text-text-main">{formatCurrency(activeUnit.tagihanTotal || 0)}</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-[11px] mb-1 font-bold">
                    <span className="text-text-muted">Efektivitas SPP</span>
                    <span className={isSehat ? 'text-emerald-600 dark:text-emerald-400' : isKritis ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                      {activeUnit.kolektibilitas === null || activeUnit.kolektibilitas === undefined || activeUnit.kolektibilitas === 'N/A' ? 'N/A' : `${activeUnit.kolektibilitas}%`}
                    </span>
                  </div>
                  <div className="w-full bg-bg border border-border rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSehat ? 'bg-emerald-600 dark:bg-emerald-500' : isKritis ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, kolektibilitasVal))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Ringkasan Finansial Arus Kas Operasional */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-text-main text-sm flex items-center gap-2">
                    <Coins size={16} className="text-blue-500 dark:text-blue-400" />
                    Audit Kas & Keuangan Operasional
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Arus kas riil pemasukan dan pengeluaran pada unit ini.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => handleOpenKasMasuk(activeUnit?.id)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Kas Masuk <ArrowRight size={12} />
                  </button>
                  <span className="text-text-muted/40">•</span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => handleOpenKasKeluar(activeUnit?.id)}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Kas Keluar <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Total Kas Masuk:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(activeUnit.kasMasuk || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-medium">Total Kas Keluar:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(activeUnit.kasKeluar || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border font-semibold">
                  <span className="text-text-muted">Saldo Kas Bersih Unit:</span>
                  <span className={`font-bold ${(activeUnit.saldoKas || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(activeUnit.saldoKas || 0)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Action Hub */}
          <div className="p-3.5 sm:p-4 short:py-2 short:px-4 pb-safe-modal sm:pb-4 short:pb-2 border-t border-border bg-bg/50 flex flex-col sm:flex-row short:flex-row items-center justify-end gap-2.5 short:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto short:w-auto px-4 py-2.5 short:py-1.5 rounded-xl border border-border text-text-muted hover:text-text-main hover:bg-surface text-xs font-bold transition-colors min-h-[44px] short:min-h-[36px]"
            >
              Tutup Panel
            </button>
            {activeUnit?.id && (
              <button
                type="button"
                onClick={() => handleOpenDashboardUnit(activeUnit.id)}
                className="w-full sm:w-auto short:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 short:py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-text-main text-xs font-bold transition-colors shadow-2xs min-h-[44px] short:min-h-[36px]"
              >
                <LayoutDashboard size={14} />
                Buka Dashboard Unit
              </button>
            )}
            <Link
              href="/kelas"
              className="w-full sm:w-auto short:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 short:py-1.5 rounded-xl bg-[#065f32] hover:bg-[#054d28] text-white text-xs font-bold transition-colors shadow-xs min-h-[44px] short:min-h-[36px]"
            >
              Audit Rombel di Modul Kelas <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
