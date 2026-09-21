import React from "react"
import { Search, Filter, FileSpreadsheet, FileText, UploadCloud, Plus, X, Loader2, ChevronDown, RefreshCw, Printer } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Toolbar({ children, className = "" }: { children: React.ReactNode, className?: string }) {
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
    <div className={`flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 short:gap-2 mb-4 sm:mb-6 short:mb-3 w-full ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2.5 sm:gap-3 short:gap-1.5 w-full sm:w-auto">
        {leftChildren}
      </div>
      {rightChildren && (
        <div className="shrink-0 w-full sm:w-auto sm:ml-auto pt-1 sm:pt-0 short:pt-0">
          {rightChildren}
        </div>
      )}
    </div>
  )
}

interface ToolbarSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  containerClassName?: string
  isLoading?: boolean
}

export function ToolbarSearch({ className, containerClassName, onClear, isLoading, value, ...props }: ToolbarSearchProps) {
  const widthClass = containerClassName?.includes("w-") ? "" : "sm:w-48 xl:w-52"
  return (
    <div className={`relative w-full ${widthClass} flex-shrink-0 ${containerClassName || ""}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        className={`w-full pl-10 ${isLoading || (onClear && value) ? 'pr-9' : 'pr-4'} py-2.5 sm:py-2 short:py-1.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50 min-h-[44px] sm:min-h-[38px] short:min-h-[34px] touch-manipulation ${className || ''}`}
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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
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
    <div className={`relative flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2 sm:py-1.5 short:py-1 focus-within:ring-2 focus-within:ring-primary/50 w-full sm:w-auto sm:max-w-[160px] xl:max-w-[180px] min-h-[44px] sm:min-h-[38px] short:min-h-[34px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      {icon && <div className="text-text-muted shrink-0 pointer-events-none">{icon}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-0.5 pr-6 outline-none cursor-pointer disabled:cursor-not-allowed truncate w-full appearance-none touch-manipulation"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0" />
    </div>
  )
}

export function ToolbarActions({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end ${className}`}>
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
      className={`w-full sm:w-auto flex-1 sm:flex-initial min-w-[75px] justify-center border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 focus:ring-green-500/50 min-h-[44px] sm:min-h-[36px] short:min-h-[32px] touch-manipulation cursor-pointer ${className}`}
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
      className={`w-full sm:w-auto flex-1 sm:flex-initial min-w-[75px] justify-center border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 focus:ring-rose-500/50 min-h-[44px] sm:min-h-[36px] short:min-h-[32px] touch-manipulation cursor-pointer ${className}`}
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
      className={`w-full sm:w-auto col-span-2 sm:col-span-1 flex-1 sm:flex-initial min-w-[90px] justify-center border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 focus:ring-emerald-500/50 min-h-[44px] sm:min-h-[36px] short:min-h-[32px] touch-manipulation cursor-pointer ${className}`}
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
      className={`w-full sm:w-auto col-span-2 sm:col-span-1 justify-center shadow-sm min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold touch-manipulation cursor-pointer ${className}`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Button>
  )
}

export function ToolbarRefreshButton({ 
  onClick, 
  disabled, 
  isLoading, 
  title = "Segarkan Data",
  className = "" 
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  isLoading?: boolean, 
  title?: string,
  className?: string 
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`w-full sm:w-auto col-span-2 sm:col-span-1 min-h-[44px] sm:min-h-[36px] short:min-h-[32px] px-3 border-border hover:bg-bg text-text-muted hover:text-text-main focus:ring-primary/50 touch-manipulation cursor-pointer justify-center ${className}`}
    >
      <RefreshCw size={15} className={`shrink-0 ${isLoading ? 'animate-spin text-primary' : ''}`} />
      <span className="sm:hidden font-semibold text-xs ml-2 text-text-main">
        {isLoading ? 'Menyegarkan...' : title}
      </span>
    </Button>
  )
}

export function ToolbarPrintButton({
  onClick,
  disabled,
  label = "Cetak",
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
      className={`w-full sm:w-auto flex-1 sm:flex-initial min-w-[75px] justify-center border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-500/50 min-h-[44px] sm:min-h-[36px] short:min-h-[32px] touch-manipulation cursor-pointer font-semibold shadow-2xs ${className}`}
    >
      <Printer size={16} className="mr-1.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Button>
  )
}
