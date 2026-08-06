"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { setGlobalContext } from "@/actions/app-context"

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
  
  const [unit, setUnit] = useState(activeUnitId || schoolUnits[0]?.id || "")
  const [year, setYear] = useState(activeYearId || academicYears[0]?.id || "")

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
      router.refresh()
    })
  }
  
  const isUnitLocked = schoolUnits.length <= 1;

  return (
    <header className="h-[80px] px-6 bg-surface border-b border-border flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1.5">
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
              {schoolUnits.map(u => (
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
        
        <div className="flex flex-col gap-1.5">
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

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-bg hover:text-primary transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}
