"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { setGlobalContext } from "@/actions/app-context"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

type SchoolUnit = { id: string; name: string }
type AcademicYear = { id: string; name: string }

interface HeaderProps {
  user: { name?: string | null; role?: string; avatar?: string | null }
  schoolUnits: SchoolUnit[]
  academicYears: AcademicYear[]
  activeUnitId?: string
  activeYearId?: string
}

export default function Header({ user, schoolUnits, academicYears, activeUnitId, activeYearId }: HeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const isHoldingRole = user?.role === "ADMIN" || user?.role === "YAYASAN";
  const [unit, setUnit] = useState(activeUnitId || (isHoldingRole ? "all" : schoolUnits[0]?.id) || "")
  const [year, setYear] = useState(activeYearId || academicYears[0]?.id || "")

  useEffect(() => {
    if (activeUnitId) {
      setUnit(activeUnitId)
    }
  }, [activeUnitId])

  useEffect(() => {
    if (activeYearId) {
      setYear(activeYearId)
    }
  }, [activeYearId])
  

  const handleChange = (type: "unit" | "year", value: string) => {
    let newUnit = unit
    let newYear = year
    
    if (type === "unit") {
      newUnit = value
      setUnit(value)
    } else {
      newYear = value
      setYear(value)
    }

    startTransition(async () => {
      await setGlobalContext(newUnit, newYear)
      window.location.reload()
    })
  }

  const handleManualRefresh = () => {
    startTransition(() => {
      window.location.reload()
    })
  }
  
  const isUnitLocked = !isHoldingRole && schoolUnits.length <= 1;

  return (
    <header className="py-3 px-3.5 short:py-1.5 short:px-3 md:py-4 md:px-6 bg-surface border-b border-border flex items-center justify-between shadow-2xs shrink-0">
      <div className="flex items-center justify-between gap-2.5 md:gap-6 w-full">
        {/* Dropdown Container: 2 Kolom proporsional di mobile (50/50), inline di desktop */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0 md:flex md:flex-none md:gap-6">
          {/* 1. Unit Sekolah */}
          <div className="flex flex-col gap-1 short:gap-0.5 min-w-0">
            <label className="text-[10px] short:text-[9px] font-bold text-text-muted uppercase tracking-wider pl-0.5 truncate">
              Unit Sekolah
            </label>
            <div className="relative">
              <select 
                className={`appearance-none border text-xs sm:text-sm font-semibold py-2 short:py-1 short:text-xs pl-3 pr-7 rounded-xl focus:outline-none w-full md:min-w-[180px] truncate ${
                  isUnitLocked 
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" 
                    : "cursor-pointer bg-surface border-border text-text-main shadow-2xs hover:shadow-xs transition-shadow focus:ring-2 focus:ring-primary/30"
                }`}
                value={unit} 
                onChange={(e) => handleChange("unit", e.target.value)}
                disabled={isPending || isUnitLocked}
              >
                {(user?.role === "ADMIN" || user?.role === "YAYASAN") && (
                  <option value="all">Semua Unit (Konsolidasi)</option>
                )}
                {[...schoolUnits]
                  .sort((a, b) => {
                    const getLvl = (n: string) => {
                      const str = n.toUpperCase();
                      if (str.includes("SD")) return 1;
                      if (str.includes("SMP")) return 2;
                      if (str.includes("SMA")) return 3;
                      if (str.includes("SMK")) return 4;
                      return 5;
                    };
                    return getLvl(a.name) - getLvl(b.name);
                  })
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        
          {/* 2. Tahun Akademik */}
          <div className="flex flex-col gap-1 short:gap-0.5 min-w-0">
            <label className="text-[10px] short:text-[9px] font-bold text-text-muted uppercase tracking-wider pl-0.5 truncate">
              Tahun Akademik
            </label>
            <div className="relative">
              <select 
                className="appearance-none bg-surface border border-border shadow-2xs hover:shadow-xs transition-shadow text-xs sm:text-sm font-semibold text-text-main py-2 short:py-1 short:text-xs pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:min-w-[180px] truncate" 
                value={year} 
                onChange={(e) => handleChange("year", e.target.value)}
                disabled={isPending}
              >
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Aksi Header: Theme Toggle & Refresh Ringkas */}
        <div className="flex items-end shrink-0 pt-3 md:pt-0 short:pt-0 gap-2">
          <ThemeToggle variant="icon" />
          <button 
            onClick={handleManualRefresh}
            disabled={isPending}
            className="h-9 w-9 short:h-8 short:w-8 md:h-10 md:w-10 rounded-xl bg-bg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors disabled:opacity-50 border border-border flex items-center justify-center cursor-pointer shadow-2xs"
            title="Segarkan Konteks"
          >
            <RefreshCw size={16} className={isPending ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>
    </header>
  )
}
