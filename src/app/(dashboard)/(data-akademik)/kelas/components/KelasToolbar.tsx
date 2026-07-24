import { Search, Loader2, FileSpreadsheet, FileIcon as FilePdf, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

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
  setShowModalImportMurid,
  setShowModalKelas,
  setShowModalSubKelas,
  setShowModalMurid,
  setFormKelas,
  setFormSubKelas,
  setFormMurid
}: any) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
      
      <div className="flex flex-wrap gap-3 items-center flex-1">
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari..." 
            className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isLoadingStudents && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="text-primary animate-spin" />
            </div>
          )}
        </div>
        
        {activeTab === "sub-kelas" && initialMajors.length > 0 && (
          <select 
            className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
            value={filterJurusanId}
            onChange={(e) => setFilterJurusanId(e.target.value)}
          >
            <option value="">Semua Jurusan</option>
            {initialMajors.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}
        
        {(activeTab === "murid" || activeTab === "alumni") && (
          <>
            <select 
              className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
              value={filterMuridTingkat}
              onChange={(e) => { setFilterMuridTingkat(e.target.value); setFilterMuridSubKelas("") }}
            >
              <option value="">Semua Tingkat</option>
              {grades.filter((g: any) => g.unitSekolahId === (activeUnitId || schoolUnits[0]?.id)).map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            
            {initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).length > 0 && (
              <select 
                className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={filterMuridJurusan}
                onChange={(e) => { setFilterMuridJurusan(e.target.value); setFilterMuridSubKelas("") }}
              >
                <option value="">Semua Jurusan</option>
                {initialMajors.filter((m: any) => m.unitSekolahId === activeUnitId).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            
            <select 
              className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium max-w-[150px] truncate"
              value={filterMuridSubKelas}
              onChange={(e) => setFilterMuridSubKelas(e.target.value)}
            >
              <option value="">Semua Rombel</option>
              {classrooms.filter((c: any) => c.unitSekolahId === (activeUnitId || schoolUnits[0]?.id) && (!filterMuridTingkat || c.tingkatId === filterMuridTingkat) && (!filterMuridJurusan || c.jurusanId === filterMuridJurusan)).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {activeTab === "alumni" && (
              <select 
                className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={filterAlumniStatus}
                onChange={(e) => setFilterAlumniStatus(e.target.value)}
              >
                <option value="SEMUA">Semua Status</option>
                <option value="NON_AKTIF">Semua (Non-Aktif)</option>
                <option value="LULUS">Lulus</option>
                <option value="PINDAH">Pindah</option>
                <option value="CUTI">Cuti</option>
                <option value="KELUAR">Keluar (DO)</option>
              </select>
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

        <div className="flex gap-2 border-l border-border pl-3" title="Ekspor data siswa sesuai filter saat ini">
          <Button 
            variant="outline" 
            size="sm" 
            className="opacity-100 border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
            onClick={handleExportExcel}
            disabled={isExporting || (activeTab !== 'murid' && activeTab !== 'alumni')}
          >
            <FileSpreadsheet size={16} className="mr-1.5" /> 
            {isExporting ? 'Mengekspor...' : 'Excel'}
          </Button>
          <Button variant="outline" size="sm" className="opacity-50 cursor-not-allowed" disabled title="Akan hadir di fase berikutnya">
            <FilePdf size={16} className="mr-1.5" /> PDF
          </Button>
          {activeTab === "murid" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
              onClick={() => setShowModalImportMurid(true)}
            >
              <Upload size={16} className="mr-1.5" /> Impor Excel
            </Button>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {activeTab === "kelas" && (
          <Button onClick={() => {
            setFormKelas({ id: "", name: "", order: 1, unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
            setShowModalKelas(true)
          }}><Plus size={16} className="mr-1.5" /> Tambah Tingkat</Button>
        )}
        {activeTab === "sub-kelas" && (
          <Button onClick={() => {
            setFormSubKelas({ id: "", name: "", tingkatId: "", jurusanId: "", tahunAkademikId: activeYearId || academicYears[0]?.id || "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "" })
            setShowModalSubKelas(true)
          }}>
            <Plus size={16} className="mr-2" /> Tambah Sub Kelas
          </Button>
        )}
        {activeTab === "murid" && (
          <Button onClick={() => {
            setFormMurid({
              id: "", nisn: "", name: "", unitSekolahId: activeUnitId || schoolUnits[0]?.id || "", subKelasId: "",
              previousSchool: "", phone: "", birthDate: "", email: "", studentStatus: "AKTIF",
              parentName: "", parentPhone: "", religion: "Islam", gender: "Laki-laki",
              address: "", formNo: "", username: ""
            })
            setShowModalMurid(true)
          }}>
            <Plus size={16} className="mr-2" /> Tambah Murid
          </Button>
        )}
      </div>
    </div>
  )
}
