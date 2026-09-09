"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Menu } from "lucide-react"
import { setGlobalContext } from "@/actions/app-context"
import { useMobileMenu } from "./MobileMenuContext"

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
  
  const { toggleMobileMenu } = useMobileMenu()

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
    <header className="h-auto min-h-[80px] py-4 px-4 md:px-6 bg-surface border-b border-border flex flex-col md:flex-row md:items-center justify-between shadow-sm shrink-0 gap-4 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {toggleMobileMenu && (
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
              onClick={toggleMobileMenu}
            >
              <Menu size={24} />
            </button>
          )}
          
          <div className="flex flex-1 md:flex-none flex-row gap-2 md:gap-6 overflow-x-auto hide-scrollbar">
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1">Unit Sekolah</label>
              <div className="relative">
                <select 
                  className={`appearance-none border text-sm font-semibold py-2 pl-4 pr-10 rounded-xl focus:outline-none min-w-[180px] ${
                    isUnitLocked 
                      ? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" 
                      : "cursor-pointer bg-surface border-border text-text-main shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-primary/30"
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
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1">Tahun Akademik</label>
          <div className="relative">
            <select 
              className="appearance-none bg-surface border border-border shadow-sm hover:shadow-md transition-shadow text-sm font-semibold text-text-main py-2 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[180px]" 
              value={year} 
              onChange={(e) => handleChange("year", e.target.value)}
              disabled={isPending}
            >
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
      
      <div className="flex items-center justify-end w-full md:w-auto mt-4 md:mt-0 gap-3 border-t md:border-t-0 border-border pt-4 md:pt-0">
        <button 
          onClick={handleManualRefresh}
          disabled={isPending}
          className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 border border-gray-200"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={isPending ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  )
}
