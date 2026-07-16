import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover border border-transparent",
  secondary: "bg-surface text-text-main hover:bg-surface-hover border border-border shadow-sm",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
  outline: "bg-transparent text-primary hover:bg-primary/5 border border-primary",
}

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
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
  const baseClass = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
  const variantClass = variants[variant]
  const sizeClass = sizes[size]

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 flex items-center justify-center">{leftIcon}</span>
      ) : null}
      {children}
    </button>
  )
}
