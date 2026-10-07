"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

interface ThemeToggleProps {
  variant?: "pill" | "icon"
  className?: string
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkIsDark = () => {
      const hasDarkClass = document.documentElement.classList.contains("dark")
      const saved = localStorage.getItem("siraya_theme")
      return saved === "dark" || (!saved && hasDarkClass)
    }
    setIsDark(checkIsDark())

    const handleThemeChange = () => {
      setIsDark(checkIsDark())
    }

    window.addEventListener("themechange", handleThemeChange)
    return () => window.removeEventListener("themechange", handleThemeChange)
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    const nextTheme = nextDark ? "dark" : "light"

    if (nextDark) {
      document.documentElement.classList.add("dark")
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", "light")
    }

    try {
      localStorage.setItem("siraya_theme", nextTheme)
      document.cookie = `siraya_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`
    } catch {}

    window.dispatchEvent(new Event("themechange"))
  }

  // Fallback rendering stabil sebelum client hydration
  if (!mounted) {
    if (variant === "pill") {
      return (
        <div
          className={`h-9 px-3 rounded-xl border border-border bg-surface text-text-muted flex items-center gap-2 text-xs font-medium opacity-70 ${className}`}
          aria-hidden="true"
        >
          <div className="w-4 h-4 rounded-full border border-border" />
          <span>Mode Tema</span>
        </div>
      )
    }
    return (
      <div
        className={`h-9 w-9 short:h-8 short:w-8 md:h-10 md:w-10 rounded-xl bg-bg border border-border flex items-center justify-center opacity-70 ${className}`}
        aria-hidden="true"
      />
    )
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`h-9 px-3 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-main shadow-2xs hover:shadow-xs transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 group ${className}`}
        title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
        aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      >
        <span className="w-4 h-4 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
          {isDark ? (
            <Moon size={15} />
          ) : (
            <Sun size={15} />
          )}
        </span>
        <span className="text-text-muted group-hover:text-text-main transition-colors">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`h-9 w-9 short:h-8 short:w-8 md:h-10 md:w-10 rounded-xl bg-bg hover:bg-surface-hover text-text-muted hover:text-primary transition-colors border border-border flex items-center justify-center cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${className}`}
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
    >
      <span className="w-4 h-4 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
        {isDark ? (
          <Moon size={16} />
        ) : (
          <Sun size={16} />
        )}
      </span>
    </button>
  )
}
