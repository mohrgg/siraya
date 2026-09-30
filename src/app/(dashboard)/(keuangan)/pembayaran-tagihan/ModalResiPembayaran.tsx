"use client"

import React from "react"
import InteractiveReceiptModal, { ReceiptData as InteractiveReceiptData } from "@/components/shared/print/InteractiveReceiptModal"

export type ReceiptData = InteractiveReceiptData

interface ModalResiPembayaranProps {
  isOpen: boolean
  onClose: () => void
  data: ReceiptData | null
  pengaturan?: any
  unitInfo?: any
  currentUser?: any
}

export default function ModalResiPembayaran(props: ModalResiPembayaranProps) {
  return <InteractiveReceiptModal {...props} />
}
