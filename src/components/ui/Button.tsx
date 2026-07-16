import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = "btn"
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const disabledClass = disabled || isLoading ? "btn-disabled" : ""

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" />
      ) : leftIcon ? (
        <span className="btn-icon">{leftIcon}</span>
      ) : null}
      {children}
    </button>
  )
}
