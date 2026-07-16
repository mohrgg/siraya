"use client"

import { LogOut, Bell, User as UserIcon } from "lucide-react"

type SchoolUnit = { id: string; name: string }
type AcademicYear = { id: string; name: string }

interface HeaderProps {
  user: { name?: string | null; role?: string; avatar?: string | null }
  schoolUnits: SchoolUnit[]
  academicYears: AcademicYear[]
}

export default function Header({ user, schoolUnits, academicYears }: HeaderProps) {
  // In a real app, these values would be managed in a global store (Zustand/Context)
  // For now, we'll just mock the selected state
  
  return (
    <header className="header">
      <div className="header-left">
        <div className="select-group">
          <label className="select-label">Unit Sekolah</label>
          <select className="header-select">
            {schoolUnits.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
        
        <div className="select-group">
          <label className="select-label">Tahun Akademik</label>
          <select className="header-select">
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
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
