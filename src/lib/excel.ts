import * as XLSX from 'xlsx';

/**
 * Menerima array of objects dan mengekspornya menjadi file Excel (.xlsx).
 * Dijalankan di sisi Client (Browser).
 * 
 * @param data Array of objects yang akan diekspor
 * @param fileName Nama file (tanpa ekstensi .xlsx)
 * @param sheetName Nama sheet di dalam file Excel (opsional)
 */
export interface ExcelExportOptions {
  title?: string;
  unitInfo?: { name: string; address?: string; phone?: string };
  sheetName?: string;
}

export function exportToExcel(data: any[], fileName: string, options?: ExcelExportOptions) {
  if (!data || data.length === 0) {
    console.warn('Data kosong, tidak ada yang diekspor');
    return;
  }

  const sheetName = options?.sheetName || 'Sheet1';
  let worksheet: XLSX.WorkSheet;

  if (options?.title || options?.unitInfo) {
    // Mode dengan Kop Surat & Judul
    const wsData: any[][] = [];
    
    // 1. Kop Surat
    if (options.unitInfo?.name) {
      wsData.push([options.unitInfo.name.toUpperCase()]);
    } else {
      wsData.push(["YAYASAN SIRAYA"]);
    }
    
    // 2. Judul
    if (options.title) {
      wsData.push([options.title.toUpperCase()]);
    }
    
    // 3. Tanggal Cetak
    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    wsData.push([`Dicetak pada: ${dateStr}`]);
    wsData.push([]); // Baris Kosong

    // 4. Header Tabel
    const headers = Object.keys(data[0]);
    wsData.push(headers);

    // 5. Data Tabel
    data.forEach(row => {
      wsData.push(headers.map(h => row[h]));
    });

    worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Styling & Column Width (estimasi lebar kolom berdasarkan panjang string)
    const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }));
    worksheet['!cols'] = colWidths;
    
  } else {
    // Mode Grid Biasa
    worksheet = XLSX.utils.json_to_sheet(data);
    const headers = Object.keys(data[0]);
    const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }));
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Fungsi khusus untuk mengunduh template Excel Impor Siswa dengan 2 Sheet (Data & Referensi ID).
 */
export function downloadSiswaTemplate(schoolUnits: any[] = [], classrooms: any[] = []) {
  const templateData = [
    {
      "NISN": "0051234567",
      "NIS": "2025001",
      "Nama Lengkap": "Ahmad Dahlan",
      "Jenis Kelamin": "Laki-laki",
      "Agama": "Islam",
      "Tempat Lahir": "Bandung",
      "Tanggal Lahir (YYYY-MM-DD)": "2008-05-14",
      "No Telepon Ortu": "081234567890",
      "Alamat": "Jl. Merdeka No 1, Bandung",
      "ID Sub Kelas (Opsional)": ""
    },
    {
      "NISN": "0067654321",
      "NIS": "2025002",
      "Nama Lengkap": "Siti Aisyah",
      "Jenis Kelamin": "Perempuan",
      "Agama": "Islam",
      "Tempat Lahir": "Jakarta",
      "Tanggal Lahir (YYYY-MM-DD)": "2009-01-20",
      "No Telepon Ortu": "081987654321",
      "Alamat": "Jl. Sudirman No 2, Jakarta",
      "ID Sub Kelas (Opsional)": ""
    }
  ];

  const refData = classrooms && classrooms.length > 0 ? classrooms.map((c: any, index: number) => ({
    "No": index + 1,
    "Nama Rombel / Sub Kelas": c.name || "-",
    "Tingkat": c.tingkat?.name || "-",
    "Jurusan": c.jurusan?.name || "Umum",
    "Unit Sekolah": schoolUnits.find((u: any) => u.id === c.unitSekolahId)?.name || "-",
    "ID Sub Kelas (Salin ke Sheet 1 jika perlu)": c.id
  })) : [
    {
      "No": 1,
      "Nama Rombel / Sub Kelas": "X IPA 1 (Contoh)",
      "Tingkat": "Kelas 10",
      "Jurusan": "IPA",
      "Unit Sekolah": "SMA SIRAYA",
      "ID Sub Kelas (Salin ke Sheet 1 jika perlu)": "clx12345exampleid67890"
    }
  ];

  const workbook = XLSX.utils.book_new();
  const sheet1 = XLSX.utils.json_to_sheet(templateData);
  const sheet2 = XLSX.utils.json_to_sheet(refData);

  XLSX.utils.book_append_sheet(workbook, sheet1, "Data_Impor_Siswa");
  XLSX.utils.book_append_sheet(workbook, sheet2, "Referensi_ID_Rombel");

  XLSX.writeFile(workbook, "Template_Impor_Siswa_Siraya.xlsx");
}

/**
 * Menerima object mapping berupa nama Sheet dan datanya, 
 * kemudian mengekspornya menjadi satu file Excel (.xlsx) dengan banyak sheet.
 * Dijalankan di sisi Client (Browser).
 * 
 * @param dataMap Record<string, any[]> di mana key adalah nama sheet, value adalah array of objects
 * @param fileName Nama file (tanpa ekstensi .xlsx)
 */
export function exportMultiSheetExcel(dataMap: Record<string, any[]>, fileName: string) {
  if (!dataMap || Object.keys(dataMap).length === 0) {
    console.warn('Data kosong, tidak ada yang diekspor');
    return;
  }

  // 1. Buat workbook kosong
  const workbook = XLSX.utils.book_new();

  // 2. Loop melalui setiap sheet dan data
  for (const [sheetName, data] of Object.entries(dataMap)) {
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      // Nama sheet di Excel maksimal 31 karakter
      const validSheetName = sheetName.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, validSheetName);
    } else {
      // Jika data kosong, buat sheet kosong dengan pesan
      const worksheet = XLSX.utils.json_to_sheet([{ Info: "Tidak ada data untuk modul ini" }]);
      const validSheetName = sheetName.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, validSheetName);
    }
  }

  // 3. Unduh file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
