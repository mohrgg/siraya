"use client"

import React from "react"

export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems?: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
  itemName?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = ""
}: PaginationControlsProps) {
  if (totalPages <= 0 && (!totalItems || totalItems === 0)) return null

  const safeTotalPages = Math.max(1, totalPages)
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= safeTotalPages

  return (
    <div
      className={`p-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface rounded-b-2xl ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="px-3 py-1.5 bg-bg border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={isFirstPage}
          className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        <span className="px-4 py-1.5 text-sm font-medium text-text-main">
          Hal {currentPage} dari {safeTotalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={isLastPage}
          className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  )
}
export default PaginationControls
