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
    <header className="header">
      <div className="header-left">
        <div className="select-group">
          <label className="select-label">Unit Sekolah</label>
          <select 
            className="header-select" 
            value={unit} 
            onChange={(e) => handleChange("unit", e.target.value)}
            disabled={isPending}
          >
            {schoolUnits.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        
        <div className="select-group">
          <label className="select-label">Tahun Akademik</label>
          <select 
            className="header-select" 
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

      <div className="header-right">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}
