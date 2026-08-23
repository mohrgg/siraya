import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useSortableData } from "@/hooks/useSortableData"
import { getSiswaPaginated, promoteSiswaBatch } from "@/actions/siswa"

export function useKelasData({ activeUnitId, activeYearId, initialGrades, initialMajors, initialClassrooms, initialStudents, academicYears, schoolUnits }: any) {
  const [activeTab, setActiveTab] = useState<"kelas" | "sub-kelas" | "murid" | "alumni">("kelas")

  // Core Data States
  const [grades, setGrades] = useState(initialGrades)
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [students, setStudents] = useState(initialStudents)

  const [pageSize, setPageSize] = useState(10)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Update data if initial props change
  useEffect(() => {
    setGrades(initialGrades)
    setClassrooms(initialClassrooms)
    setStudents(initialStudents)
  }, [initialGrades, initialClassrooms, initialStudents])

  // UI States
  const [searchTerm, setSearchTerm] = useState("")
  const [filterJurusanId, setFilterJurusanId] = useState("")
  const [filterMuridTingkat, setFilterMuridTingkat] = useState("")
  const [filterMuridJurusan, setFilterMuridJurusan] = useState("")
  const [filterMuridSubKelas, setFilterMuridSubKelas] = useState("")
  const [filterAlumniStatus, setFilterAlumniStatus] = useState("NON_AKTIF")

  // Bulk Promote
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isPromoting, setIsPromoting] = useState(false)
  const [targetSubKelasId, setTargetSubKelasId] = useState("")

  // Pagination & Server Data for Murid
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [muridSort, setMuridSort] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' })

  // Client-side Sorting for Kelas & Sub Kelas
  const filteredGrades = grades.filter((g: any) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return g.name?.toLowerCase().includes(term) || g.unitSekolah?.name?.toLowerCase().includes(term)
  })
  const { items: sortedGrades, requestSort: requestSortGrades, sortConfig: sortGrades } = useSortableData(filteredGrades)
  
  const filteredClassrooms = classrooms.filter((c: any) => {
    const matchJurusan = filterJurusanId ? c.jurusanId === filterJurusanId : true
    if (!searchTerm) return matchJurusan
    const term = searchTerm.toLowerCase()
    return matchJurusan && (c.name?.toLowerCase().includes(term) || c.tingkat?.name?.toLowerCase().includes(term) || c.unitSekolah?.name?.toLowerCase().includes(term))
  });
  const { items: sortedClassrooms, requestSort: requestSortClassrooms, sortConfig: sortClassrooms } = useSortableData(filteredClassrooms)

  const paginatedGrades = sortedGrades.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginatedClassrooms = sortedClassrooms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  
  const computedTotalPages = (activeTab === "murid" || activeTab === "alumni") 
    ? totalPages 
    : activeTab === "kelas"
      ? Math.ceil(sortedGrades.length / pageSize) || 1
      : Math.ceil(sortedClassrooms.length / pageSize) || 1

  const handleMuridSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (muridSort.key === key && muridSort.direction === 'asc') direction = 'desc'
    else if (muridSort.key === key && muridSort.direction === 'desc') direction = null
    setMuridSort({ key, direction })
  }

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Fetch Students Paginated
  useEffect(() => {
    if (activeTab !== "murid" && activeTab !== "alumni") return;
    
    let isMounted = true;
    const fetchStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const res = await getSiswaPaginated({
          unitSekolahId: activeUnitId || schoolUnits[0]?.id || "",
          tahunAkademikId: activeYearId,
          tingkatId: filterMuridTingkat,
          jurusanId: filterMuridJurusan,
          subKelasId: filterMuridSubKelas,
          search: debouncedSearchTerm,
          page: currentPage,
          limit: pageSize,
          sortBy: muridSort.direction ? muridSort.key : undefined,
          sortOrder: muridSort.direction || undefined,
          statusFilter: activeTab === "murid" ? "AKTIF" : filterAlumniStatus
        })
        if (isMounted) {
          setStudents(res.data)
          setTotalPages(res.totalPages)
        }
      } catch (e: any) {
        if (isMounted) toast.error("Gagal mengambil data siswa: " + e.message)
      } finally {
        if (isMounted) setIsLoadingStudents(false)
      }
    }

    fetchStudents()

    return () => { isMounted = false }
  }, [activeTab, activeUnitId, activeYearId, filterMuridTingkat, filterMuridJurusan, filterMuridSubKelas, debouncedSearchTerm, currentPage, pageSize, muridSort, filterAlumniStatus, schoolUnits, refreshTrigger])

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filterMuridTingkat, filterMuridJurusan, filterMuridSubKelas, filterAlumniStatus, activeTab])

  const [targetTahunAkademikId, setTargetTahunAkademikId] = useState("")

  // Bulk Promote Handler
  const handleBulkPromote = async () => {
    if (selectedStudents.length === 0 || !targetSubKelasId || !targetTahunAkademikId) {
      toast.error("Pilih murid, tahun ajaran, dan kelas tujuan terlebih dahulu")
      return
    }
    setIsPromoting(true)
    try {
      const res = await promoteSiswaBatch(selectedStudents, targetSubKelasId, targetTahunAkademikId)
      toast.success(`Berhasil memindahkan ${res.success} murid ke kelas baru`)
      setSelectedStudents([])
      setTargetSubKelasId("")
      setTargetTahunAkademikId("")
      setFilterMuridSubKelas(targetSubKelasId)
    } catch (e: any) {
      toast.error("Gagal memindahkan murid: " + e.message)
    } finally {
      setIsPromoting(false)
    }
  }

  const handleBulkGraduation = async () => {
    if (selectedStudents.length === 0) return
    setIsPromoting(true)
    try {
      // @ts-ignore
      const { luluskanSiswaBatch } = await import("@/actions/siswa")
      const res = await luluskanSiswaBatch(selectedStudents)
      toast.success(`Berhasil meluluskan ${res.success} murid`)
      setSelectedStudents([])
    } catch (e: any) {
      toast.error("Gagal meluluskan murid: " + e.message)
    } finally {
      setIsPromoting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return
    setIsPromoting(true)
    try {
      const { hapusSiswaBatch } = await import("@/actions/siswa")
      const res = await hapusSiswaBatch(selectedStudents)
      toast.success(`Berhasil menghapus ${res.success} murid`)
      setSelectedStudents([])
      setRefreshTrigger(prev => prev + 1)
    } catch (e: any) {
      toast.error("Gagal menghapus murid: " + e.message)
    } finally {
      setIsPromoting(false)
    }
  }

  return {
    // Core Data
    grades, setGrades,
    classrooms, setClassrooms,
    students, setStudents,
    
    // UI State
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    filterJurusanId, setFilterJurusanId,
    filterMuridTingkat, setFilterMuridTingkat,
    filterMuridJurusan, setFilterMuridJurusan,
    filterMuridSubKelas, setFilterMuridSubKelas,
    filterAlumniStatus,
    setFilterAlumniStatus,
    refreshData: () => setRefreshTrigger(prev => prev + 1),
    
    // Bulk Promote
    selectedStudents, setSelectedStudents,
    isPromoting, 
    targetSubKelasId, setTargetSubKelasId,
    targetTahunAkademikId, setTargetTahunAkademikId,
    handleBulkPromote,
    handleBulkGraduation,
    handleBulkDelete,

    // Pagination & Sort
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    computedTotalPages,
    isLoadingStudents,
    muridSort, handleMuridSort,
    
    // Sorted & Paginated Arrays
    paginatedGrades, requestSortGrades, sortGrades,
    paginatedClassrooms, requestSortClassrooms, sortClassrooms
  }
}
