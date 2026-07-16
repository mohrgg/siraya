import React, { forwardRef } from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-sm font-semibold text-text-main">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3 py-2 bg-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
            error ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
          } ${className}`.trim()}
          {...props}
        />
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
      </div>
    )
  }
)

Input.displayName = "Input"
