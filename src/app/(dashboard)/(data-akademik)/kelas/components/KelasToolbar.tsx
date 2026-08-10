import { Search, Loader2, FileSpreadsheet, FileIcon as FilePdf, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions, 
  ToolbarExportExcel, 
  ToolbarExportPDF, 
  ToolbarImportExcel, 
  ToolbarAddButton, 
  ToolbarDivider 
} from "@/components/ui/DataTableToolbar"

export default function KelasToolbar({
  activeTab,
  searchTerm, setSearchTerm,
  isLoadingStudents,
  filterJurusanId, setFilterJurusanId,
  filterMuridTingkat, setFilterMuridTingkat,
  filterMuridJurusan, setFilterMuridJurusan,
  filterMuridSubKelas, setFilterMuridSubKelas,
  filterAlumniStatus, setFilterAlumniStatus,
  initialMajors,
  grades,
  classrooms,
  schoolUnits,
  activeUnitId,
  activeYearId,
  academicYears,
  handleExportExcel,
  isExporting,
  handleExportPDF,
  isExportingPDF,
  setShowModalImportMurid,
  setShowModalKelas,
  setShowModalSubKelas,
  setShowModalMurid,
  setFormKelas,
  setFormSubKelas,
  setFormMurid,
  isReadOnly
}: any) {
  return (
    <Toolbar>
      {/* Search dengan custom loading icon support (pakai relative div custom wrapper) */}
      <div className="relative w-full sm:w-44 flex-shrink-0">
        <ToolbarSearch 
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Cari..."
          className="w-full"
        />
        {isLoadingStudents && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="text-primary animate-spin" />
          </div>
        )}
      </div>

      {activeTab === "sub-kelas" && initialMajors.length > 0 && (
        <ToolbarFilter
          value={filterJurusanId}
          onChange={setFilterJurusanId}
          options={[
            { label: "Semua Jurusan", value: "" },
            ...initialMajors.map((m: any) => ({ label: m.name, value: m.id }))
          ]}
        />
      )}
        
      {(activeTab === "murid" || activeTab === "alumni") && (
        <>
          <ToolbarFilter
            value={filterMuridTingkat}
            onChange={(val) => { setFilterMuridTingkat(val); setFilterMuridSubKelas("") }}
            options={[
              { label: "Semua Tingkat", value: "" },
              ...grades.filter((g: any) => g.unitSekolahId === (activeUnitId || schoolUnits[0]?.id)).map((g: any) => ({ label: g.name, value: g.id }))
            ]}
          />
          
          {initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).length > 0 && (
            <ToolbarFilter
              value={filterMuridJurusan}
              onChange={(val) => { setFilterMuridJurusan(val); setFilterMuridSubKelas("") }}
              options={[
                { label: "Semua Jurusan", value: "" },
                ...initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).map((m: any) => ({ label: m.name, value: m.id }))
              ]}
            />
          )}
          
          <ToolbarFilter
            value={filterMuridSubKelas}
            onChange={setFilterMuridSubKelas}
            options={[
              { label: "Semua Rombel", value: "" },
              ...classrooms.filter((c: any) => c.unitSekolahId === (activeUnitId || schoolUnits[0]?.id) && (!filterMuridTingkat || c.tingkatId === filterMuridTingkat) && (!filterMuridJurusan || c.jurusanId === filterMuridJurusan)).map((c: any) => ({ label: c.name, value: c.id }))
            ]}
          />

          {activeTab === "alumni" && (
            <ToolbarFilter
              value={filterAlumniStatus}
              onChange={setFilterAlumniStatus}
              options={[
                { label: "Semua Status", value: "SEMUA" },
                { label: "Semua (Non-Aktif)", value: "NON_AKTIF" },
                { label: "Lulus", value: "LULUS" },
                { label: "Pindah", value: "PINDAH" },
                { label: "Cuti", value: "CUTI" },
                { label: "Keluar (DO)", value: "KELUAR" }
              ]}
            />
          )}

          {(searchTerm || filterMuridTingkat || filterMuridJurusan || filterMuridSubKelas || (activeTab === 'alumni' && filterAlumniStatus !== "NON_AKTIF")) && (
            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm("")
              setFilterMuridTingkat("")
              setFilterMuridJurusan("")
              setFilterMuridSubKelas("")
              if (activeTab === 'alumni') setFilterAlumniStatus("NON_AKTIF")
            }}>
              Reset Filter
            </Button>
          )}
        </>
      )}

      <ToolbarActions>
        {activeTab !== 'kelas' && (
          <>
            <ToolbarExportExcel 
              onClick={handleExportExcel} 
              isExporting={isExporting} 
              disabled={activeTab !== 'murid' && activeTab !== 'alumni' && activeTab !== 'sub-kelas'}
            />
            <ToolbarExportPDF 
              onClick={handleExportPDF} 
              isExporting={isExportingPDF} 
              disabled={activeTab !== 'murid' && activeTab !== 'alumni' && activeTab !== 'sub-kelas'}
            />
          </>
        )}

        {activeTab === "murid" && !isReadOnly && (
          <ToolbarImportExcel onClick={() => setShowModalImportMurid(true)} />
        )}

        {!isReadOnly && (
          <>
            {activeTab !== 'kelas' && <ToolbarDivider />}
            
            {activeTab === "kelas" && (
              <ToolbarAddButton onClick={() => {
                setFormKelas({ id: "", name: "", order: 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
                setShowModalKelas(true)
              }}>
                Tambah Tingkat
              </ToolbarAddButton>
            )}
            {activeTab === "sub-kelas" && (
              <ToolbarAddButton onClick={() => {
                setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
                setShowModalSubKelas(true)
              }}>
                Tambah Sub Kelas
              </ToolbarAddButton>
            )}
            {activeTab === "murid" && (
              <ToolbarAddButton onClick={() => {
                setFormMurid({
                  id: "", nisn: "", name: "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "", subKelasId: "",
                  previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "AKTIF",
                  parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
                  address: "", formNo: "", username: ""
                })
                setShowModalMurid(true)
              }}>
                Tambah Murid
              </ToolbarAddButton>
            )}
          </>
        )}
      </ToolbarActions>
    </Toolbar>
  )
}
