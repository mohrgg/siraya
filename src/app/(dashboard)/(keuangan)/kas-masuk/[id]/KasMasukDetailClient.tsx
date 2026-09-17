"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Printer, FileDown, Receipt, BookOpen, Edit, Link2, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"

export default function KasMasukDetailClient({ transaksi, pengaturan }: { transaksi: any, pengaturan?: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "resi"
  const [activeTab, setActiveTab] = useState<'resi' | 'jurnal'>(tabParam as any)

  useEffect(() => {
    if (tabParam === "resi" || tabParam === "jurnal") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const setTab = (tab: 'resi' | 'jurnal') => {
    setActiveTab(tab)
    router.replace(`/kas-masuk/${transaksi.id}?tab=${tab}`, { scroll: false })
  }

  // Pisahkan Debit dan Kredit
  const detailDebit = transaksi.detail.filter((d: any) => d.posisi === "DEBIT")
  const detailKredit = transaksi.detail.filter((d: any) => d.posisi === "KREDIT")

  const isFromTagihan = Boolean(
    transaksi.pembayaranTagihan && 
    Array.isArray(transaksi.pembayaranTagihan) && 
    transaksi.pembayaranTagihan.length > 0
  )

  // Helper untuk Terbilang Bahasa Indonesia
  const terbilang = (n: number): string => {
    if (n === 0) return "Nol"
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
    if (n < 0) return "Minus " + terbilang(-n)
    if (n < 12) return bil[n]
    if (n < 20) return terbilang(n - 10) + " Belas"
    if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh" + (n % 10 !== 0 ? " " + terbilang(n % 10) : "")
    if (n < 200) return "Seratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "")
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "")
    if (n < 2000) return "Seribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "")
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "")
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta" + (n % 1000000 !== 0 ? " " + terbilang(n % 1000000) : "")
    if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar" + (n % 1000000000 !== 0 ? " " + terbilang(n % 1000000000) : "")
    return terbilang(Math.floor(n / 1000000000000)) + " Triliun" + (n % 1000000000000 !== 0 ? " " + terbilang(n % 1000000000000) : "")
  }
  
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportResiPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportResiPdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")

      const items: any[] = []
      
      if (isFromTagihan) {
        transaksi.pembayaranTagihan.forEach((pt: any) => {
          const sisaAkhir = pt.tagihan?.sisaTagihan ?? 0
          const tagihanAwal = pt.tagihan?.jumlah ?? (pt.jumlahDibayar + (pt.potongan || 0) + sisaAkhir)
          items.push({
            keterangan: pt.tagihan?.namaTagihan || pt.tagihan?.akun?.nama || transaksi.deskripsi || "Pembayaran Tagihan",
            nominal: pt.jumlahDibayar,
            sisaTagihanAwal: tagihanAwal,
            potongan: pt.potongan || 0,
            kategoriPotongan: pt.kategoriPotongan || undefined,
            sisaTagihan: sisaAkhir
          })
        })
      } else {
        detailKredit.forEach((d: any) => {
          items.push({
            keterangan: `${d.akun.kode} - ${d.akun.nama} ${d.deskripsi ? `(${d.deskripsi})` : ''}`,
            nominal: d.nilai
          })
        })
      }

      exportResiPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, transaksi.unitSekolah),
        noReferensi: transaksi.noReferensi,
        tanggal: transaksi.tanggal,
        penerimaDari: transaksi.namaPihakKetiga || "-",
        items,
        total: transaksi.totalNilai,
        penandatanganKiri: { jabatan: "Diterima Dari / Penyetor,", nama: transaksi.namaPihakKetiga || "____________________" },
        penandatanganKanan: { jabatan: "Bendahara Penerima,", nama: transaksi.pembuat?.name || transaksi.unitSekolah?.namaBendaharaUnit || pengaturan?.namaBendaharaYayasan || "Bendahara Penerima" },
        filename: `Resi_KasMasuk_${transaksi.noReferensi}`
      })
      toast.success("Berhasil mencetak Resi")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mencetak Resi")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportJurnalPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportJurnalPdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")

      const detail = transaksi.detail.map((d: any) => ({
        kodeAkun: d.akun.kode,
        namaAkun: d.akun.nama,
        debit: d.posisi === "DEBIT" ? d.nilai : 0,
        kredit: d.posisi === "KREDIT" ? d.nilai : 0
      }))

      exportJurnalPdf({
        institutionInfo: buildInstitutionInfo(pengaturan, transaksi.unitSekolah),
        judulJurnal: "JURNAL TRANSAKSI KAS MASUK",
        noReferensi: transaksi.noReferensi,
        tanggal: transaksi.tanggal,
        deskripsi: transaksi.deskripsi || "-",
        detail,
        penandatanganKiri: { jabatan: "Dibuat Oleh,", nama: transaksi.pembuat?.name || "Petugas Keuangan" },
        penandatanganKanan: { jabatan: "Disetujui Oleh,", nama: transaksi.unitSekolah?.namaKepalaSekolah || pengaturan?.namaPimpinanYayasan || "____________________" },
        filename: `Jurnal_KasMasuk_${transaksi.noReferensi}`
      })
      toast.success("Berhasil mencetak Jurnal")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mencetak Jurnal")
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="w-full pb-24">
      <PageHeader 
        title="Detail Kas Masuk"
        subtitle={`No. Ref: ${transaksi.noReferensi}`}
        backHref="/kas-masuk"
        backLabel="Kembali ke Daftar Kas Masuk"
        backShortLabel="Kembali"
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              size="sm"
              onClick={activeTab === 'resi' ? handleExportResiPDF : handleExportJurnalPDF}
              disabled={isExportingPDF}
              className="flex-1 sm:flex-initial justify-center opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 min-h-[38px] sm:min-h-[36px]"
            >
              <FileText size={16} className="mr-1.5" /> 
              <span className="truncate">{isExportingPDF ? "Mengekspor..." : `Cetak ${activeTab === 'resi' ? 'Resi' : 'Jurnal'}`}</span>
            </Button>
            <Link href={`/kas-masuk/${transaksi.id}/edit`} className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full justify-center bg-white border-border hover:bg-bg shadow-sm text-blue-600 min-h-[38px] sm:min-h-[36px]">
                <Edit size={16} className="mr-1.5" /> Ubah
              </Button>
            </Link>
          </div>
        }
      />

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        
        <div className="px-6 py-4 border-b border-border bg-bg/50 flex justify-between items-center">
          <h2 className="font-semibold text-text-main">
            {activeTab === 'resi' ? 'Resi Pembayaran' : 'Jurnal Akuntansi'}
          </h2>
          <div className="flex bg-white border border-border rounded-lg overflow-hidden">
            <button 
              onClick={() => setTab('resi')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'resi' ? 'bg-bg text-text-main font-bold' : 'text-text-muted hover:bg-bg/50'}`}
            >
              Resi
            </button>
            <div className="w-px bg-border"></div>
            <button 
              onClick={() => setTab('jurnal')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'jurnal' ? 'bg-bg text-text-main font-bold' : 'text-text-muted hover:bg-bg/50'}`}
            >
              Jurnal
            </button>
          </div>
        </div>

        {/* TAB RESI */}
        {activeTab === 'resi' && (
          <div className="p-6 md:p-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <p className="text-text-muted mb-1">Dari :</p>
                <p className="font-semibold text-text-main text-base">{transaksi.namaPihakKetiga || "-"}</p>
                
                <p className="text-text-muted mb-1 mt-4">Ke :</p>
                <p className="font-semibold text-text-main text-base">{detailDebit[0]?.akun?.nama || "-"}</p>
                
                <p className="text-text-muted mb-1 mt-4">Deskripsi :</p>
                <p className="font-medium text-text-main">{transaksi.deskripsi || "-"}</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">Referensi Nomer :</p>
                <p className="font-semibold text-text-main">{transaksi.noReferensi}</p>
                
                <p className="text-text-muted mb-1 mt-4">Tanggal :</p>
                <p className="font-semibold text-text-main">{format(new Date(transaksi.tanggal), "dd-MM-yyyy")}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-bg/50 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                    <th className="p-3 text-center w-16">No</th>
                    <th className="p-3">Keterangan Pembayaran</th>
                    {isFromTagihan && <th className="p-3">Status Tagihan</th>}
                    {!isFromTagihan && <th className="p-3">Deskripsi</th>}
                    <th className="p-3 text-right">Jumlah Dibayar</th>
                  </tr>
                </thead>
                <tbody>
                  {isFromTagihan ? (
                    transaksi.pembayaranTagihan.map((pt: any, idx: number) => {
                      const namaTagihan = pt.tagihan?.namaTagihan || pt.tagihan?.akun?.nama || transaksi.deskripsi || "Pembayaran Tagihan"
                      const akunKategori = pt.tagihan?.akun?.nama
                      const sisaAkhir = pt.tagihan?.sisaTagihan ?? 0
                      const isSebagian = sisaAkhir > 0
                      const tagihanAwal = pt.tagihan?.jumlah ?? (pt.jumlahDibayar + (pt.potongan || 0) + sisaAkhir)

                      return (
                        <tr key={pt.id || idx} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                          <td className="p-3 text-center text-text-muted align-top">{idx + 1}</td>
                          <td className="p-3 align-top">
                            <div className="font-semibold text-text-main text-base">
                              {namaTagihan}
                              {akunKategori && akunKategori !== namaTagihan && (
                                <span className="text-xs text-text-muted font-normal ml-2">({akunKategori})</span>
                              )}
                            </div>
                            
                            {/* Breakdown Tagihan Awal, Diskon, dan Sisa Tagihan */}
                            <div className="space-y-1 mt-1.5 text-xs text-text-muted">
                              {tagihanAwal > 0 && (pt.potongan > 0 || isSebagian) && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">Tagihan Awal:</span>
                                  <span>Rp {tagihanAwal.toLocaleString('id-ID')}</span>
                                </div>
                              )}

                              {pt.potongan !== undefined && pt.potongan > 0 && (
                                <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                                  <span>Diskon ({pt.kategoriPotongan || 'Potongan'}):</span>
                                  <span>-Rp {pt.potongan.toLocaleString('id-ID')}</span>
                                </div>
                              )}

                              {isSebagian ? (
                                <div className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 w-fit">
                                  <span>* Pembayaran Sebagian. Sisa Tagihan Akhir:</span>
                                  <span className="font-bold">Rp {sisaAkhir.toLocaleString('id-ID')}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 w-fit">
                                  <span>* Status: Tagihan Lunas</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-top">
                            {isSebagian ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Sebagian
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Lunas
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-text-main text-base align-top">
                            Rp {pt.jumlahDibayar.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    detailKredit.map((d: any, idx: number) => (
                      <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                        <td className="p-3 text-center text-text-muted">{idx + 1}</td>
                        <td className="p-3 font-medium text-text-main">{d.akun.kode} - {d.akun.nama}</td>
                        <td className="p-3 text-text-muted">{d.deskripsi}</td>
                        <td className="p-3 text-right font-bold text-text-main">Rp {d.nilai.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-bg/50 border-t border-border">
                    <td colSpan={isFromTagihan ? 3 : 3} className="p-3 font-bold text-text-muted text-right">TOTAL PEMBAYARAN</td>
                    <td className="p-3 text-right font-bold text-albas-green text-lg">Rp {transaksi.totalNilai.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td colSpan={isFromTagihan ? 4 : 4} className="p-3 italic text-text-muted bg-white border-t border-border">
                      Terbilang : {terbilang(transaksi.totalNilai)} Rupiah
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 text-center text-sm">
              <div>
                <p className="text-text-muted mb-24">Dibuat Oleh</p>
                <div className="border-b border-border w-48 mx-auto"></div>
                <p className="mt-2 font-medium">{transaksi.pembuat?.name}</p>
              </div>
              <div>
                <p className="text-text-muted mb-24">Diterima Oleh</p>
                <div className="border-b border-border w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB JURNAL */}
        {activeTab === 'jurnal' && (
          <div className="p-6 md:p-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-3 mb-6 text-sm">
              <div className="text-text-muted">Referensi Nomer</div>
              <div className="font-semibold text-text-main">: {transaksi.noReferensi}</div>
              
              <div className="text-text-muted">Tanggal</div>
              <div className="font-semibold text-text-main">: {format(new Date(transaksi.tanggal), "dd-MM-yyyy")}</div>
              
              <div className="text-text-muted">Deskripsi</div>
              <div className="font-semibold text-text-main">: {transaksi.deskripsi || "-"}</div>
            </div>

            {/* Konteks Tagihan Siswa (jika transaksi berasal dari tagihan) */}
            {isFromTagihan && (
              <div className="mb-8 p-4 sm:p-5 rounded-xl border border-border bg-bg/40 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Konteks Tagihan Siswa:</span>
                    <span className="font-bold text-text-main">{transaksi.namaPihakKetiga || "-"}</span>
                  </div>
                  {transaksi.pembayaranTagihan.some((pt: any) => (pt.tagihan?.sisaTagihan ?? 0) > 0) ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Status: Pembayaran Sebagian (Belum Lunas)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Status: Lunas
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {(() => {
                    const tagihanAwal = transaksi.pembayaranTagihan.reduce((acc: number, pt: any) => {
                      const sisa = pt.tagihan?.sisaTagihan ?? 0
                      return acc + (pt.tagihan?.jumlah ?? (pt.jumlahDibayar + (pt.potongan || 0) + sisa))
                    }, 0)
                    const totalPotongan = transaksi.pembayaranTagihan.reduce((acc: number, pt: any) => acc + (pt.potongan || 0), 0)
                    const totalDibayar = transaksi.pembayaranTagihan.reduce((acc: number, pt: any) => acc + (pt.jumlahDibayar || 0), 0)
                    const totalSisa = transaksi.pembayaranTagihan.reduce((acc: number, pt: any) => acc + (pt.tagihan?.sisaTagihan ?? 0), 0)

                    return (
                      <>
                        <div className="bg-white p-3 rounded-lg border border-border">
                          <p className="text-text-muted mb-1 font-medium">Tagihan Awal</p>
                          <p className="text-base font-bold text-text-main">Rp {tagihanAwal.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-border">
                          <p className="text-text-muted mb-1 font-medium">Potongan / Beasiswa</p>
                          <p className="text-base font-bold text-rose-600">Rp {totalPotongan.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-border">
                          <p className="text-text-muted mb-1 font-medium">Dibayar Termin Ini (Kas)</p>
                          <p className="text-base font-bold text-emerald-600">Rp {totalDibayar.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-border">
                          <p className="text-text-muted mb-1 font-medium">Sisa Tagihan Belum Lunas</p>
                          <p className={`text-base font-bold ${totalSisa > 0 ? 'text-amber-600' : 'text-text-muted'}`}>
                            Rp {totalSisa.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-bg/50 text-text-muted text-xs uppercase tracking-wider border-b border-border">
                    <th className="p-3">Kode Akun</th>
                    <th className="p-3">Nama Akun</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.detail.map((d: any) => (
                    <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-text-main">{d.akun.kode}</td>
                      <td className="p-3 font-medium text-text-main">{d.akun.nama}</td>
                      <td className="p-3 text-right font-bold text-text-main">
                        {d.posisi === "DEBIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-text-main">
                        {d.posisi === "KREDIT" ? `Rp ${d.nilai.toLocaleString('id-ID')}` : "-"}
                      </td>
                    </tr>
                  ))}
                  {(() => {
                    const totalDebit = transaksi.detail?.filter((d: any) => d.posisi === "DEBIT").reduce((sum: number, d: any) => sum + d.nilai, 0) || 0
                    const totalKredit = transaksi.detail?.filter((d: any) => d.posisi === "KREDIT").reduce((sum: number, d: any) => sum + d.nilai, 0) || 0
                    return (
                      <tr className="bg-bg/50 border-t border-border">
                        <td colSpan={2} className="p-3 font-bold text-text-muted text-right">Total</td>
                        <td className="p-3 text-right font-bold text-text-main">Rp {totalDebit.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-bold text-text-main">Rp {totalKredit.toLocaleString('id-ID')}</td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>

            <div className="mt-16 text-center text-sm w-48">
              <p className="text-text-muted mb-24">Dibuat Oleh:</p>
              <div className="border-b border-border w-full"></div>
              <p className="mt-2 font-medium">{transaksi.pembuat?.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
