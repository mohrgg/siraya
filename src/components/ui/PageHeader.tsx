import React from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  badge?: string
  className?: string
}

export function PageHeader({ title, subtitle, action, badge, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-6 bg-surface/80 backdrop-blur-xs rounded-2xl border border-border p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-1.5 h-10 bg-primary rounded-full mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-main tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {action}
        </div>
      )}
    </div>
  )
}
