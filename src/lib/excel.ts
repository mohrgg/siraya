import * as XLSX from 'xlsx';

/**
 * Menerima array of objects dan mengekspornya menjadi file Excel (.xlsx).
 * Dijalankan di sisi Client (Browser).
 * 
 * @param data Array of objects yang akan diekspor
 * @param fileName Nama file (tanpa ekstensi .xlsx)
 * @param sheetName Nama sheet di dalam file Excel (opsional)
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    console.warn('Data kosong, tidak ada yang diekspor');
    return;
  }

  // 1. Buat worksheet dari data JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Buat workbook kosong
  const workbook = XLSX.utils.book_new();

  // 3. Masukkan worksheet ke dalam workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 4. Unduh file (otomatis memicu fitur download di browser)
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Fungsi khusus untuk mengunduh template Excel Impor Siswa.
 */
export function downloadSiswaTemplate() {
  const templateData = [
    {
      "NISN": "1234567890",
      "Nama Lengkap": "Ahmad Dahlan",
      "Jenis Kelamin": "L",
      "Agama": "ISLAM",
      "Tempat Lahir": "Bandung",
      "Tanggal Lahir": "2005-12-31",
      "Alamat": "Jl. Merdeka No 1"
    },
    {
      "NISN": "0987654321",
      "Nama Lengkap": "Siti Aisyah",
      "Jenis Kelamin": "P",
      "Agama": "ISLAM",
      "Tempat Lahir": "Jakarta",
      "Tanggal Lahir": "2006-01-15",
      "Alamat": "Jl. Jendral Sudirman No 2"
    }
  ];

  exportToExcel(templateData, 'Template_Impor_Siswa', 'Template');
}
