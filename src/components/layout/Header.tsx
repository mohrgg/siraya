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
  
  return (
    <header className="h-16 px-6 bg-surface border-b border-border flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Unit Sekolah</label>
          <select 
            className="bg-bg border-none text-sm font-semibold text-text-main py-1.5 px-3 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[150px]" 
            value={unit} 
            onChange={(e) => handleChange("unit", e.target.value)}
            disabled={isPending}
          >
            {schoolUnits.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Tahun Akademik</label>
          <select 
            className="bg-bg border-none text-sm font-semibold text-text-main py-1.5 px-3 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[150px]" 
            value={year} 
            onChange={(e) => handleChange("year", e.target.value)}
            disabled={isPending}
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
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
