import React from "react"
import { Pengaturan } from "@prisma/client"

interface PrintHeaderProps {
  unitInfo?: { name: string; address?: string | null; phone?: string | null; email?: string | null; website?: string | null; logo?: string | null; [key: string]: any } | null
  pengaturan?: Pengaturan | null
  className?: string
}

export default function PrintHeader({ unitInfo, pengaturan, className = "hidden print:block" }: PrintHeaderProps) {
  const logoUrl = unitInfo?.logo || pengaturan?.logoUrl
  const subtitle = unitInfo 
    ? `${unitInfo.address || pengaturan?.alamat || ""}${unitInfo.phone ? ` • Telp: ${unitInfo.phone}` : ""}${unitInfo.email ? ` • Email: ${unitInfo.email}` : ""}`
    : `${pengaturan?.alamat || ""}${pengaturan?.telepon ? ` • Telp: ${pengaturan.telepon}` : ""}${pengaturan?.email ? ` • Email: ${pengaturan.email}` : ""}`
    
  return (
    <div className={`${className} w-full mb-6`}>
      <div className="flex items-center mb-4">
        {/* Logo */}
        <div className="w-24 h-24 relative mr-6 flex-shrink-0">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>
        
        {/* Header Text */}
        <div className="flex-1 flex flex-col justify-center text-center pr-30">
          {unitInfo ? (
            <>
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-slate-800 mb-1">
                {pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH"}
              </h2>
              <h1 className="text-[26px] font-black uppercase tracking-[0.1em] text-slate-900 mb-2 leading-tight">
                {unitInfo.name}
              </h1>
            </>
          ) : (
            <h1 className="text-[26px] font-black uppercase tracking-[0.1em] text-slate-900 mb-2 leading-tight mt-2">
              {pengaturan?.namaYayasan || "YAYASAN AL BASYARIAH"}
            </h1>
          )}
          <p className="text-[13px] text-slate-700 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Balancer for centering (same width as logo + margin) */}
        <div className="w-24 ml-6 flex-shrink-0"></div>
      </div>
      
      {/* Double Border Line */}
      <div className="w-full border-b-[4px] border-slate-900 mb-[2px]"></div>
      <div className="w-full border-b-[1px] border-slate-900"></div>
    </div>
  )
}
