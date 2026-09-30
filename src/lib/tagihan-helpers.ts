/**
 * Helper dan utility untuk pemformatan dan pengelolaan tagihan siswa Siraya.
 */

export interface ItemPembayaranDeskripsi {
  namaAkun: string
  jumlahBayar: number
  potongan?: number
}

/**
 * Menghasilkan deskripsi spesifik dan informatif untuk transaksi pembayaran tagihan.
 * Baik untuk 1 pos pembayaran maupun gabungan multi-item dalam 1 transaksi.
 *
 * Contoh Output:
 * - 1 Item: "Pembayaran SPP KELAS X September 2026 - Siswa: Fathir Fathurrahman"
 * - Multi Item: "Pembayaran SPP KELAS X September 2026, PTS Semester Ganjil - Siswa: Fathir Fathurrahman"
 * - Multi Banyak: "Pembayaran SPP, PTS, BAT, PSB - Siswa: Fathir Fathurrahman"
 */
export function buildDeskripsiPembayaranTagihan(
  items: ItemPembayaranDeskripsi[],
  muridName: string
): string {
  const cleanMurid = (muridName || "").trim()

  // Ambil hanya item yang dibayar atau memiliki potongan
  const activeItems = (items || []).filter(
    (item) => (item.jumlahBayar || 0) > 0 || (item.potongan || 0) > 0
  )

  if (activeItems.length === 0) {
    return cleanMurid ? `Pembayaran Tagihan Siswa: ${cleanMurid}` : "Pembayaran Tagihan Siswa"
  }

  // Dapatkan daftar nama pos pembayaran unik dan bersihkan spasi
  const uniquePosList: string[] = []
  for (const item of activeItems) {
    const rawName = (item.namaAkun || "").trim()
    if (!rawName) continue
    if (!uniquePosList.includes(rawName)) {
      uniquePosList.push(rawName)
    }
  }

  if (uniquePosList.length === 0) {
    return cleanMurid ? `Pembayaran Tagihan Siswa: ${cleanMurid}` : "Pembayaran Tagihan Siswa"
  }

  // Skenario 1 Item
  if (uniquePosList.length === 1) {
    const pos = uniquePosList[0]
    return cleanMurid 
      ? `Pembayaran ${pos} - Siswa: ${cleanMurid}` 
      : `Pembayaran ${pos}`
  }

  // Skenario Multi Item (Gabungan beberapa tagihan dalam 1 transaksi)
  const fullJoined = uniquePosList.join(", ")
  let candidate = cleanMurid 
    ? `Pembayaran ${fullJoined} - Siswa: ${cleanMurid}`
    : `Pembayaran ${fullJoined}`

  // Jika terlalu panjang (> 180 karakter), buat versi ringkas cerdas
  if (candidate.length > 180) {
    const shortenedList = uniquePosList.map((pos) => {
      // Ringkas label umum jika terlalu panjang
      // Contoh: "SPP KELAS X September 2026" -> "SPP Sep 2026" atau "SPP"
      if (pos.toUpperCase().includes("SPP")) {
        const matchBulan = pos.match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\b(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\b)/i)
        return matchBulan ? `SPP (${matchBulan[0]})` : "SPP"
      }
      if (pos.toUpperCase().includes("PTS") || pos.toUpperCase().includes("PAT")) {
        return pos.replace(/penilaian\s+tengah\s+semester/gi, "PTS").replace(/penilaian\s+akhir\s+tahun/gi, "PAT")
      }
      return pos
    })

    const shortJoined = shortenedList.join(", ")
    candidate = cleanMurid 
      ? `Pembayaran ${shortJoined} - Siswa: ${cleanMurid}`
      : `Pembayaran ${shortJoined}`
  }

  return candidate
}
