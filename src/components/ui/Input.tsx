import React, { forwardRef } from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${error ? "input-error" : ""} ${className}`.trim()}
          {...props}
        />
        {error && <span className="text-error text-sm mt-1">{error}</span>}
      </div>
    )
  }
)

Input.displayName = "Input"
