// Definisi 6 Domain Modul Fungsional Siraya untuk Audit Trail

export interface AuditDomain {
  id: string;
  name: string;
  moduls: string[];
  description: string;
}

export const AUDIT_DOMAINS: AuditDomain[] = [
  { 
    id: "keuangan", 
    name: "Keuangan & Kas", 
    moduls: ["AKUN_KEUANGAN", "KAS"],
    description: "Buku besar, akun rekening, dan mutasi arus kas" 
  },
  { 
    id: "tagihan", 
    name: "Tagihan & Pembayaran", 
    moduls: ["PEMBUATAN_TAGIHAN", "PEMBAYARAN_TAGIHAN"],
    description: "Penerbitan tagihan siswa dan kuitansi pembayaran" 
  },
  { 
    id: "murid", 
    name: "Kesiswaan & Rombel", 
    moduls: ["MANAJEMEN_MURID", "AKADEMIK_SISWA"],
    description: "Data siswa, kenaikan kelas, dan rombongan belajar" 
  },
  { 
    id: "kepegawaian", 
    name: "Kepegawaian & Guru", 
    moduls: ["KEPEGAWAIAN", "MANAJEMEN_GURU"],
    description: "Data guru, staf administrasi, dan status kepegawaian" 
  },
  { 
    id: "user", 
    name: "Akses & Pengguna", 
    moduls: ["MANAJEMEN_USER"],
    description: "Pengelolaan akun pengguna, peran, dan hak akses" 
  },
  { 
    id: "sistem", 
    name: "Sistem & Otentikasi", 
    moduls: ["PENGATURAN", "PENGATURAN_BACKUP", "PENGATURAN_AKADEMIK", "SISTEM"],
    description: "Konfigurasi sistem, backup database, dan log sesi" 
  },
]

export interface AuditCockpitSummary {
  kpi: {
    totalAll: number;
    totalMutasi: number;
    totalDelete: number;
    totalUpdate: number;
    totalCreate: number;
    totalLogin: number;
    totalActors: number;
  };
  domainCards: Array<{
    id: string;
    name: string;
    description: string;
    moduls: string[];
    total: number;
    breakdown: {
      creates: number;
      updates: number;
      deletes: number;
    };
    lastLog: {
      aksi: string;
      keterangan: string;
      createdAt: string;
      actor: string;
    } | null;
  }>;
}
