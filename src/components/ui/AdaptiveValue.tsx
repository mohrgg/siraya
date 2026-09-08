"use client"

import React, { useEffect, useLayoutEffect, useRef, useState } from "react"

interface AdaptiveValueProps extends React.HTMLAttributes<HTMLElement> {
  value: string | number
  className?: string
  maxFontSize?: number // in px, default: 30 (equivalent to text-3xl)
  minFontSize?: number // in px, default: 14 (equivalent to text-sm)
  as?: "span" | "div" | "p" | "h2" | "h3"
}

/**
 * AdaptiveValue:
 * Menampilkan teks nilai/nominal finansial secara dinamis.
 * - Jika nominal pendek (misal: "47", "12", "Rp 500.000"), ukuran font tetap BESAR standar (maxFontSize, misal: 30px / text-3xl).
 * - Jika nominal panjang mendekati atau melebihi batas lebar kartu (misal: "Rp 226.400.000"),
 *   font otomatis mengecil (auto-shrink) secara proporsional agar SELURUH angka tetap terlihat penuh tanpa elipsis (...) dan tanpa overflow.
 */
export function AdaptiveValue({
  value,
  className = "",
  maxFontSize = 30,
  minFontSize = 14,
  as: Component = "span",
  ...props
}: AdaptiveValueProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const stringVal = String(value ?? "")

  // Perkiraan awal SSR agar tidak ada flash layout shift
  const initialSize = stringVal.length > 15 ? 20 : stringVal.length > 12 ? 24 : maxFontSize
  const [fontSize, setFontSize] = useState<number>(initialSize)

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const updateFontSize = () => {
      const containerWidth = container.clientWidth
      if (containerWidth <= 0) return

      // Reset ke ukuran standar maksimal untuk mengukur lebar asli teks tanpa batas
      textEl.style.fontSize = `${maxFontSize}px`
      const textWidth = textEl.scrollWidth

      if (textWidth > containerWidth) {
        // Teks mendekati atau melewati batas lebar card: otomatis kecilkan secara presisi
        const safetyPadding = 4 // Margin aman agar tidak menempel di tepi kanan
        const ratio = Math.max(0.1, (containerWidth - safetyPadding) / textWidth)
        const calculatedSize = Math.max(minFontSize, Math.floor(maxFontSize * ratio))
        setFontSize(calculatedSize)
        textEl.style.fontSize = `${calculatedSize}px`
      } else {
        // Teks masih lapang: pertahankan ukuran font standar yang besar
        setFontSize(maxFontSize)
        textEl.style.fontSize = `${maxFontSize}px`
      }
    }

    updateFontSize()

    // Pantau perubahan ukuran card saat responsive resize atau sidebar toggle
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateFontSize()
      })
      resizeObserver.observe(container)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [stringVal, maxFontSize, minFontSize])

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden flex items-baseline">
      <Component
        ref={textRef as any}
        style={{ fontSize: `${fontSize}px` }}
        className={`tracking-tight font-black whitespace-nowrap leading-none select-text ${className}`}
        title={stringVal}
        {...props}
      >
        {stringVal}
      </Component>
    </div>
  )
}
