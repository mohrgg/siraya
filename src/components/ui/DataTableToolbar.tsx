import React from "react"
import { Search, Filter, FileSpreadsheet, FileText, UploadCloud, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Toolbar({ children }: { children: React.ReactNode }) {
  const leftChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && (child.type === ToolbarActions || (child.type as any).isToolbarActions)) {
      return null
    }
    return child
  })

  const rightChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && (child.type === ToolbarActions || (child.type as any).isToolbarActions)) {
      return child
    }
    return null
  })

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 w-full">
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full overflow-x-auto hide-scrollbar pb-1">
        {leftChildren}
      </div>
      <div className="shrink-0 w-full xl:w-auto">
        {rightChildren}
      </div>
    </div>
  )
}

interface ToolbarSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function ToolbarSearch({ className, ...props }: ToolbarSearchProps) {
  return (
    <div className="relative w-full sm:w-64 flex-shrink-0">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        className={`w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50 ${className || ''}`}
        {...props}
      />
    </div>
  )
}

interface FilterOption {
  label: string
  value: string
}
interface ToolbarFilterProps {
  icon?: React.ReactNode
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  disabled?: boolean
  className?: string
}
export function ToolbarFilter({ icon = <Filter size={14} />, value, onChange, options, disabled, className }: ToolbarFilterProps) {
  return (
    <div className={`flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      {icon && <div className="text-text-muted shrink-0">{icon}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-0.5 outline-none cursor-pointer disabled:cursor-not-allowed truncate w-full"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export function ToolbarActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 flex-wrap items-center w-full justify-end">
      {children}
    </div>
  )
}
ToolbarActions.isToolbarActions = true;

export function ToolbarDivider() {
  return <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
}

export function ToolbarExportExcel({ onClick, disabled, isExporting, label = "Excel" }: { onClick: () => void, disabled?: boolean, isExporting?: boolean, label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isExporting}
      className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 focus:ring-green-500/50"
    >
      <FileSpreadsheet size={16} className="mr-1.5" />
      {isExporting ? 'Mengekspor...' : label}
    </Button>
  )
}

export function ToolbarExportPDF({ onClick, disabled, isExporting, label = "PDF" }: { onClick: () => void, disabled?: boolean, isExporting?: boolean, label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isExporting}
      className="border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 focus:ring-rose-500/50"
    >
      <FileText size={16} className="mr-1.5" />
      {isExporting ? 'Mengekspor...' : label}
    </Button>
  )
}

export function ToolbarImportExcel({ onClick, disabled, label = "Impor Excel" }: { onClick: () => void, disabled?: boolean, label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 focus:ring-emerald-500/50"
    >
      <UploadCloud size={16} className="mr-1.5" />
      {label}
    </Button>
  )
}

export function ToolbarAddButton({ onClick, disabled, children, icon = <Plus size={16} className="mr-1.5" /> }: { onClick: () => void, disabled?: boolean, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="shadow-sm"
    >
      {icon}
      <span>{children}</span>
    </Button>
  )
}
