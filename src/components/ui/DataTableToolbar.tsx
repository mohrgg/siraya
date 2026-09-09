import React from "react"
import { Search, Filter, FileSpreadsheet, FileText, UploadCloud, Plus, X, Loader2 } from "lucide-react"
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

interface ToolbarSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  containerClassName?: string
  isLoading?: boolean
}
export function ToolbarSearch({ className, containerClassName, onClear, isLoading, value, ...props }: ToolbarSearchProps) {
  return (
    <div className={`relative w-full sm:w-56 flex-shrink-0 ${containerClassName || ''}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        className={`w-full pl-10 ${isLoading || (onClear && value) ? 'pr-9' : 'pr-4'} py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50 ${className || ''}`}
        {...props}
      />
      {isLoading ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <Loader2 size={16} className="text-primary animate-spin" />
        </div>
      ) : onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5 rounded-full hover:bg-gray-100 transition-colors"
          title="Hapus pencarian"
        >
          <X size={14} />
        </button>
      ) : null}
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

export function ToolbarActions({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end ${className}`}>
      {children}
    </div>
  )
}
ToolbarActions.isToolbarActions = true;

export function ToolbarDivider() {
  return <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
}

export function ToolbarExportExcel({ 
  onClick, 
  disabled, 
  isExporting, 
  label = "Excel",
  className = ""
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  isExporting?: boolean, 
  label?: string,
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isExporting}
      className={`flex-1 sm:flex-initial min-w-[75px] justify-center border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 focus:ring-green-500/50 ${className}`}
    >
      <FileSpreadsheet size={16} className="mr-1.5 shrink-0" />
      <span className="truncate">{isExporting ? 'Mengekspor...' : label}</span>
    </Button>
  )
}

export function ToolbarExportPDF({ 
  onClick, 
  disabled, 
  isExporting, 
  label = "PDF",
  className = ""
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  isExporting?: boolean, 
  label?: string,
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isExporting}
      className={`flex-1 sm:flex-initial min-w-[75px] justify-center border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 focus:ring-rose-500/50 ${className}`}
    >
      <FileText size={16} className="mr-1.5 shrink-0" />
      <span className="truncate">{isExporting ? 'Mengekspor...' : label}</span>
    </Button>
  )
}

export function ToolbarImportExcel({ 
  onClick, 
  disabled, 
  label = "Impor Excel",
  className = ""
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  label?: string,
  className?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 sm:flex-initial min-w-[90px] justify-center border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 focus:ring-emerald-500/50 ${className}`}
    >
      <UploadCloud size={16} className="mr-1.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Button>
  )
}

export function ToolbarAddButton({ 
  onClick, 
  disabled, 
  children, 
  icon = <Plus size={16} className="mr-1.5 shrink-0" />,
  className = ""
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  children: React.ReactNode, 
  icon?: React.ReactNode,
  className?: string
}) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`w-full sm:w-auto justify-center shadow-sm min-h-[38px] font-bold ${className}`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Button>
  )
}
