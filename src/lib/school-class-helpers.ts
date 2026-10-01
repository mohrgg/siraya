/**
 * Helper pengurutan alami jenjang tingkat & kelas sekolah (SD, SMP, SMA, SMK).
 * Isomorphic: aman diimpor di Server Action maupun Client Component.
 */

export function getLevelOrder(str: string): { level: number; suffix: string } {
  const clean = (str || "").trim().toUpperCase()

  // 1. Cek Angka Romawi (XII turun ke I)
  const romanMap: Record<string, number> = {
    'XII': 12, 'XI': 11, 'X': 10, 'IX': 9, 'VIII': 8, 'VII': 7,
    'VI': 6, 'V': 5, 'IV': 4, 'III': 3, 'II': 2, 'I': 1
  }
  for (const [roman, num] of Object.entries(romanMap)) {
    const regex = new RegExp(`\\b${roman}\\b`)
    if (regex.test(clean)) {
      return { level: num, suffix: clean.replace(regex, '').trim() }
    }
  }

  // 2. Cek Angka Arab (1-12)
  const matchNum = clean.match(/\b([1-9]|1[0-2])\b/)
  if (matchNum) {
    return { level: parseInt(matchNum[1], 10), suffix: clean.replace(matchNum[0], '').trim() }
  }

  // 3. Cek format angka 2 digit SMP (71-79 -> level 7, 81-89 -> level 8, 91-99 -> level 9)
  const matchSmp = clean.match(/^([7-9])(\d)$/)
  if (matchSmp) {
    return { level: parseInt(matchSmp[1], 10), suffix: matchSmp[2] }
  }

  // 4. Fallback jika tidak ada angka
  return { level: 999, suffix: clean }
}

export function sortSchoolClasses(a: string, b: string): number {
  const parsedA = getLevelOrder(a)
  const parsedB = getLevelOrder(b)
  if (parsedA.level !== parsedB.level) {
    return parsedA.level - parsedB.level
  }
  return parsedA.suffix.localeCompare(parsedB.suffix, 'id', { numeric: true, sensitivity: 'base' })
}
