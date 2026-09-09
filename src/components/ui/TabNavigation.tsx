"use client"

import React from "react"

export interface TabItem {
  id: string
  label: string
  shortLabel?: string
  icon?: React.ElementType
  badge?: string | number
  badgeColor?: string
}

interface TabNavigationProps {
  tabs: TabItem[]
  activeTab?: string
  onChange?: (id: string) => void
  className?: string
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = ""
}: TabNavigationProps) {
  if (!tabs || tabs.length === 0) return null

  const currentTab = activeTab || tabs[0].id
  const isSingle = tabs.length === 1
  const isBinary = tabs.length === 2
  const isTriple = tabs.length === 3
  const isQuad = tabs.length === 4

  // CASE 1 TAB: Context header on mobile, standard Siraya Tabbed Card Header on desktop
  if (isSingle) {
    const singleTab = tabs[0]
    const Icon = singleTab.icon
    const mobileLabel = singleTab.shortLabel || singleTab.label

    return (
      <div className={`w-full ${className}`}>
        {/* Desktop View (Classic Siraya border-b tab) */}
        <div className="hidden md:flex gap-2 mb-6 border-b border-border">
          <button
            type="button"
            className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary flex items-center gap-2 cursor-default"
          >
            {Icon && <Icon size={16} className="shrink-0" />}
            <span>{singleTab.label}</span>
            {singleTab.badge !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-bold">
                {singleTab.badge}
              </span>
            )}
          </button>
        </div>

        {/* Mobile View (Active Context Badge Header) */}
        <div className="md:hidden flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl border border-primary/20 shadow-2xs max-w-full">
            {Icon && <Icon size={14} className="shrink-0" />}
            <span className="truncate">{mobileLabel}</span>
            {singleTab.badge !== undefined && (
              <span className="ml-1 px-1.5 py-0.2 bg-primary text-white text-[10px] rounded-full shrink-0">
                {singleTab.badge}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // MULTI-TAB CASES (2, 3, 4, 5+ Tabs)
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop View: Standard Horizontal Tabs (Identical for all multi-tab cases) */}
      <div className="hidden md:flex gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-text-muted hover:text-text-main hover:border-border"
              }`}
            >
              {Icon && <Icon size={16} className="shrink-0" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-bg text-text-muted"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile View: Dynamic Segmented Layout */}
      {/* CASE 2 TABS: 2-Segmented Switcher (50 / 50) */}
      {isBinary && (
        <div className="md:hidden grid grid-cols-2 gap-1 p-1 bg-bg border border-border rounded-2xl mb-5 shadow-2xs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            const Icon = tab.icon
            const mobileLabel = tab.shortLabel || tab.label

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange?.(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[42px] min-w-0 cursor-pointer ${
                  isActive
                    ? "bg-surface text-primary shadow-xs border border-border/60"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                {Icon && <Icon size={15} className="shrink-0" />}
                <span className="truncate max-w-full">{mobileLabel}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-surface text-text-muted"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* CASE 3 TABS: 3-Segmented Switcher */}
      {isTriple && (
        <div className="md:hidden grid grid-cols-3 gap-1 p-1 bg-bg border border-border rounded-2xl mb-5 shadow-2xs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            const Icon = tab.icon
            const mobileLabel = tab.shortLabel || tab.label

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange?.(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all min-h-[46px] min-w-0 text-center cursor-pointer ${
                  isActive
                    ? "bg-surface text-primary shadow-xs border border-border/60"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 max-w-full">
                  {Icon && <Icon size={14} className="shrink-0" />}
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono shrink-0 ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "bg-surface text-text-muted"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="truncate text-[11px] leading-tight max-w-full">
                  {mobileLabel}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* CASE 4 TABS: 2x2 Segmented Touch Grid */}
      {isQuad && (
        <div className="md:hidden grid grid-cols-2 gap-1.5 p-1 bg-bg border border-border rounded-2xl mb-5 shadow-2xs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            const Icon = tab.icon
            const mobileLabel = tab.shortLabel || tab.label

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange?.(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] min-w-0 cursor-pointer ${
                  isActive
                    ? "bg-surface text-primary shadow-xs border border-border/60"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                {Icon && <Icon size={15} className="shrink-0" />}
                <span className="truncate max-w-full">{mobileLabel}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-surface text-text-muted"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* CASE 5+ TABS: Scrollable Pills Bar with subtle indicators */}
      {!isBinary && !isTriple && !isQuad && (
        <div className="md:hidden flex gap-1.5 p-1 bg-bg border border-border rounded-2xl mb-5 overflow-x-auto custom-scrollbar shadow-2xs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange?.(tab.id)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[42px] cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-surface text-primary shadow-xs border border-border/60"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                {Icon && <Icon size={14} className="shrink-0" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-surface text-text-muted"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
