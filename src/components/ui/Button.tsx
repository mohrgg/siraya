import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "danger-soft" | "outline" | "ghost" | "neutral"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover border border-transparent shadow-xs",
  secondary: "bg-surface text-text-main hover:bg-surface-hover border border-border shadow-xs",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-sm shadow-rose-200/50",
  "danger-soft": "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
  outline: "bg-transparent text-primary hover:bg-primary/5 border border-primary",
  ghost: "bg-transparent text-text-main hover:bg-gray-100 border border-transparent",
  neutral: "bg-surface text-text-main hover:bg-surface-hover border border-border shadow-xs",
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
