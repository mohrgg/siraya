import React from "react"
import { UnitSekolah, Pengaturan } from "@prisma/client"

interface PrintHeaderProps {
  unitInfo?: UnitSekolah | null
  pengaturan?: Pengaturan | null
  className?: string
}

export default function PrintHeader({ unitInfo, pengaturan, className = "hidden print:block" }: PrintHeaderProps) {
  const logoUrl = unitInfo?.logo || pengaturan?.logoUrl
  const subtitle = unitInfo 
    ? `${unitInfo.address || pengaturan?.alamat || ""}${unitInfo.phone ? ` • Telp: ${unitInfo.phone}` : ""}${unitInfo.email ? ` • Email: ${unitInfo.email}` : ""}`
    : `${pengaturan?.alamat || ""}${pengaturan?.telepon ? ` • Telp: ${pengaturan.telepon}` : ""}${pengaturan?.email ? ` • Email: ${pengaturan.email}` : ""}`
    
  return (
    <div className={`${className} w-full mb-8 border-b-[3px] border-double border-slate-800 pb-4`}>
      <div className="flex items-center">
        {logoUrl ? (
          <div className="w-20 h-20 relative mr-4 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-20 h-20 mr-4 shrink-0" />
        )}
        <div className="flex-1 text-center pr-24">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-1">
            {pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH"}
          </h2>
          <h1 className="text-2xl font-black uppercase tracking-widest mb-2">
            {unitInfo ? unitInfo.name : "SISTEM INFORMASI SIRAYA"}
          </h1>
          <p className="text-xs text-gray-700 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}
