/**
 * Utilitas Pengurutan & Format Rentang Kalender Akademik (Juli s/d Juni)
 * Digunakan untuk menyajikan kolom tunggakan SPP secara ringkas, rapi, dan kronologis.
 */

export const ACADEMIC_MONTHS = [
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni"
] as const

export type AcademicMonth = typeof ACADEMIC_MONTHS[number]

export const MONTH_SHORT_MAP: Record<AcademicMonth, string> = {
  "Juli": "Jul",
  "Agustus": "Agu",
  "September": "Sep",
  "Oktober": "Okt",
  "November": "Nov",
  "Desember": "Des",
  "Januari": "Jan",
  "Februari": "Feb",
  "Maret": "Mar",
  "April": "Apr",
  "Mei": "Mei",
  "Juni": "Jun"
}

// Regex alias untuk mendeteksi variasi penulisan bulan dalam deskripsi tagihan
const MONTH_REGEX_PATTERNS: Array<{ month: AcademicMonth; pattern: RegExp }> = [
  { month: "Januari", pattern: /\b(januari|jan|january)\b/i },
  { month: "Februari", pattern: /\b(februari|feb|peb|february)\b/i },
  { month: "Maret", pattern: /\b(maret|mar|march)\b/i },
  { month: "April", pattern: /\b(april|apr)\b/i },
  { month: "Mei", pattern: /\b(mei|may)\b/i },
  { month: "Juni", pattern: /\b(juni|jun|june)\b/i },
  { month: "Juli", pattern: /\b(juli|jul|july)\b/i },
  { month: "Agustus", pattern: /\b(agustus|agu|ags|agust|august)\b/i },
  { month: "September", pattern: /\b(september|sep|sept)\b/i },
  { month: "Oktober", pattern: /\b(oktober|okt|oct|october)\b/i },
  { month: "November", pattern: /\b(november|nov)\b/i },
  { month: "Desember", pattern: /\b(desember|des|dec|december)\b/i },
]

/**
 * Mengekstrak nama bulan kanonikal dari teks (misal: "SPP Kelas X Juli 2026" -> "Juli")
 */
export function parseMonthFromText(text: string): AcademicMonth | null {
  if (!text) return null
  for (const { month, pattern } of MONTH_REGEX_PATTERNS) {
    if (pattern.test(text)) {
      return month
    }
  }
  return null
}

export interface MonthSpanResult {
  displayShort: string        // Contoh: "Jul – Apr" atau "Jul – Sep, Nov – Des"
  displayFull: string         // Contoh: "Juli – April (10 Bulan)"
  unpaidIndices: number[]     // Indeks 0..11 yang menunggak
  sortedMonths: AcademicMonth[]
  allMonthsStatus: Array<{
    name: AcademicMonth
    shortName: string
    index: number
    isUnpaid: boolean
    semester: 1 | 2
  }>
  count: number
}

/**
 * Mengelompokkan daftar bulan tunggakan menjadi rentang cerdas (Contiguous Span Grouping)
 */
export function formatAcademicMonthSpans(rawMonths: string[]): MonthSpanResult {
  if (!rawMonths || rawMonths.length === 0) {
    return {
      displayShort: "-",
      displayFull: "-",
      unpaidIndices: [],
      sortedMonths: [],
      allMonthsStatus: ACADEMIC_MONTHS.map((m, idx) => ({
        name: m,
        shortName: MONTH_SHORT_MAP[m],
        index: idx,
        isUnpaid: false,
        semester: idx < 6 ? 1 : 2
      })),
      count: 0
    }
  }

  // 1. Ekstrak dan mapping ke index akademik 0..11
  const indexSet = new Set<number>()
  const unparsedSet = new Set<string>()

  for (const raw of rawMonths) {
    if (!raw) continue
    const canonical = parseMonthFromText(raw)
    if (canonical) {
      const idx = ACADEMIC_MONTHS.indexOf(canonical)
      if (idx !== -1) indexSet.add(idx)
    } else if (raw.trim()) {
      unparsedSet.add(raw.trim())
    }
  }

  const sortedIndices = Array.from(indexSet).sort((a, b) => a - b)
  const sortedMonths = sortedIndices.map(idx => ACADEMIC_MONTHS[idx])
  const unparsed = Array.from(unparsedSet)
  const count = sortedIndices.length + unparsed.length

  if (count === 0) {
    return {
      displayShort: "-",
      displayFull: "-",
      unpaidIndices: [],
      sortedMonths: [],
      allMonthsStatus: ACADEMIC_MONTHS.map((m, idx) => ({
        name: m,
        shortName: MONTH_SHORT_MAP[m],
        index: idx,
        isUnpaid: false,
        semester: idx < 6 ? 1 : 2
      })),
      count: 0
    }
  }

  // Jika tidak ada bulan kalender yang cocok tetapi ada teks mentah
  if (sortedIndices.length === 0 && unparsed.length > 0) {
    const text = unparsed.join(", ")
    return {
      displayShort: text,
      displayFull: `${text} (${unparsed.length} Item)`,
      unpaidIndices: [],
      sortedMonths: [],
      allMonthsStatus: ACADEMIC_MONTHS.map((m, idx) => ({
        name: m,
        shortName: MONTH_SHORT_MAP[m],
        index: idx,
        isUnpaid: false,
        semester: idx < 6 ? 1 : 2
      })),
      count: unparsed.length
    }
  }

  // 2. Status lengkap 12 bulan (untuk popover/grid)
  const allMonthsStatus = ACADEMIC_MONTHS.map((m, idx) => ({
    name: m,
    shortName: MONTH_SHORT_MAP[m],
    index: idx,
    isUnpaid: indexSet.has(idx),
    semester: (idx < 6 ? 1 : 2) as 1 | 2
  }))

  // 3. Khusus 12 bulan penuh (1 Tahun Ajaran)
  if (count === 12) {
    return {
      displayShort: "Jul – Jun",
      displayFull: "1 Tahun Penuh (Juli – Juni)",
      unpaidIndices: sortedIndices,
      sortedMonths,
      allMonthsStatus,
      count
    }
  }

  // 4. Pengelompokan blok kontigu (berurutan)
  const blocks: Array<{ start: number; end: number }> = []
  let blockStart = sortedIndices[0]
  let blockEnd = sortedIndices[0]

  for (let i = 1; i < sortedIndices.length; i++) {
    const current = sortedIndices[i]
    if (current === blockEnd + 1) {
      // Masih berurutan
      blockEnd = current
    } else {
      // Ada lompatan, simpan blok sebelumnya
      blocks.push({ start: blockStart, end: blockEnd })
      blockStart = current
      blockEnd = current
    }
  }
  blocks.push({ start: blockStart, end: blockEnd })

  // 5. Pembentukan format teks ringkas (displayShort)
  const shortSpans = blocks.map(({ start, end }) => {
    const startName = MONTH_SHORT_MAP[ACADEMIC_MONTHS[start]]
    if (start === end) {
      return startName
    }
    const endName = MONTH_SHORT_MAP[ACADEMIC_MONTHS[end]]
    return `${startName} – ${endName}`
  })

  // 6. Pembentukan format teks lengkap (displayFull untuk Excel)
  const fullSpans = blocks.map(({ start, end }) => {
    const startName = ACADEMIC_MONTHS[start]
    if (start === end) {
      return startName
    }
    const endName = ACADEMIC_MONTHS[end]
    return `${startName} – ${endName}`
  })

  const displayShort = shortSpans.join(", ")
  const displayFull = `${fullSpans.join(", ")} (${count} Bulan)`

  return {
    displayShort,
    displayFull,
    unpaidIndices: sortedIndices,
    sortedMonths,
    allMonthsStatus,
    count
  }
}
