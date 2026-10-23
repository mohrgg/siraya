import { 
  LayoutDashboard, Building, BookOpen, 
  Users2, Landmark, GraduationCap,
  Settings, Key,
  ArrowDownToLine, ArrowUpFromLine, Calendar, Users,
  FilePlus, PieChart, LucideIcon,
  UserPlus, ClipboardCheck, Layers
} from "lucide-react"

export interface MenuItem {
  href: string
  label: string
  icon: LucideIcon
  allowedRoles: string[]
  isGlobal?: boolean
}

export interface MenuGroup {
  title: string
  items: MenuItem[]
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: "UTAMA",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "DATA YAYASAN",
    items: [
      { href: "/unit-sekolah", label: "Unit Sekolah", icon: Building, allowedRoles: ["ADMIN", "YAYASAN"], isGlobal: true },
      { href: "/jurusan", label: "Program & Jurusan", icon: BookOpen, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "DATA AKADEMIK",
    items: [
      { href: "/tahun-akademik", label: "Tahun Akademik", icon: Calendar, allowedRoles: ["ADMIN", "YAYASAN"], isGlobal: true },
      { href: "/guru", label: "Guru & Staf", icon: GraduationCap, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/kelas", label: "Kelas & Murid", icon: Users2, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "PSB (SISWA BARU)",
    items: [
      { href: "/psb/pendaftaran", label: "Loket & Formulir", icon: UserPlus, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
      { href: "/psb/daftar-ulang", label: "Daftar Ulang & Tagihan", icon: ClipboardCheck, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
      { href: "/psb/gelombang", label: "Pengaturan Gelombang", icon: Layers, allowedRoles: ["ADMIN", "TATA_USAHA"] },
    ]
  },
  {
    title: "KEUANGAN",
    items: [
      { href: "/akun-keuangan", label: "Akun Keuangan", icon: Landmark, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"], isGlobal: true },
      { href: "/kas-masuk", label: "Kas Masuk", icon: ArrowDownToLine, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/kas-keluar", label: "Kas Keluar", icon: ArrowUpFromLine, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/pembuatan-tagihan", label: "Pembuatan Tagihan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA"] },
      { href: "/pembayaran-tagihan", label: "Pembayaran Tagihan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA"] },
      { href: "/rekapitulasi-tunggakan", label: "Rekap. Tagihan & Tunggakan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "LAPORAN",
    items: [
      { href: "/laporan", label: "Laporan Keuangan", icon: PieChart, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"], isGlobal: true },
    ]
  },
  {
    title: "PENGATURAN",
    items: [
      { href: "/manajemen-user", label: "Manajemen User", icon: Users, allowedRoles: ["ADMIN"], isGlobal: true },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, allowedRoles: ["ADMIN"], isGlobal: true },
    ]
  }
]

export function getFilteredMenuGroups(role: string = "TATA_USAHA"): MenuGroup[] {
  const isKepsek = role === "KEPALA_SEKOLAH"

  return MENU_GROUPS.map(group => {
    let title = group.title
    if (isKepsek) {
      if (group.title === "DATA AKADEMIK") title = "AKADEMIK & MUTU"
      if (group.title === "KEUANGAN") title = "AUDIT KEUANGAN UNIT"
      if (group.title === "LAPORAN") title = "PENGESAHAN & LAPORAN"
    }

    const items = group.items
      .filter(item => item.allowedRoles.includes(role))
      .map(item => {
        if (isKepsek) {
          if (item.href === "/kelas") return { ...item, label: "Kapasitas & Rombel" }
          if (item.href === "/guru") return { ...item, label: "Beban & Data Guru" }
          if (item.href === "/rekapitulasi-tunggakan") return { ...item, label: "Monitoring SPP & Tagihan" }
          if (item.href === "/kas-masuk") return { ...item, label: "Audit Kas Masuk" }
          if (item.href === "/kas-keluar") return { ...item, label: "Audit Kas Keluar" }
          if (item.href === "/laporan") return { ...item, label: "Laporan & Pengesahan" }
        }
        return item
      })

    return {
      ...group,
      title,
      items
    }
  }).filter(group => group.items.length > 0)
}
