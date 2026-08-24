"use client"

import React, { createContext, useContext, useState } from 'react'

type MobileMenuContextType = {
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined)

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  return (
    <MobileMenuContext.Provider value={{
      isMobileMenuOpen,
      toggleMobileMenu: () => setIsMobileMenuOpen(prev => !prev),
      closeMobileMenu: () => setIsMobileMenuOpen(false)
    }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (!context) throw new Error("useMobileMenu must be used within MobileMenuProvider")
  return context
}
