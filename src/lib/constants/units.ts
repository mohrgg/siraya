/**
 * Urutan jenjang kanonikal institusi pendidikan:
 * SD/MI -> SMP/MTs -> SMA/MA -> SMK
 */
export const getUnitLevelRank = (levelOrName?: string | null): number => {
  if (!levelOrName) return 99
  const s = levelOrName.toUpperCase()
  if (s.includes('SD') || s.includes('MI')) return 1
  if (s.includes('SMP') || s.includes('MTS')) return 2
  if (s.includes('SMA') || s.includes('MA')) return 3
  if (s.includes('SMK')) return 4
  return 5
}

export const sortUnitsByLevel = <T extends { name?: string; level?: string }>(units: T[]): T[] => {
  return [...units].sort((a, b) => {
    const rankA = getUnitLevelRank(a.level || a.name)
    const rankB = getUnitLevelRank(b.level || b.name)
    if (rankA !== rankB) return rankA - rankB
    return (a.name || '').localeCompare(b.name || '')
  })
}
