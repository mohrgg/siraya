import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAktivitas } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const rawData = formData.get("data") as string
    const unitId = formData.get("unitId") as string
    const subKelasId = formData.get("subKelasId") as string

    if (!rawData || !unitId || !subKelasId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const rows = JSON.parse(rawData)
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Get Active Tahun Akademik
    const activeTahun = await prisma.tahunAkademik.findFirst({
      where: { isActive: true },
      select: { id: true }
    })

    if (!activeTahun) {
      return NextResponse.json({ error: "Tidak ada Tahun Akademik yang aktif. Harap atur terlebih dahulu di menu Tahun Akademik." }, { status: 400 })
    }

    let successCount = 0
    let failedCount = 0
    let errors: { row: number, msg: string }[] = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2 // +2 because Excel header is row 1, and array is 0-indexed
      const row = rows[i]

      // Extract raw fields mapped from CSV header
      const nis = (row["NIS *"] || "").toString().trim()
      const nama = (row["Nama Lengkap *"] || "").toString().trim()
      const nisn = (row["NISN"] || "").toString().trim()
      const jk = (row["Jenis Kelamin"] || "").toString().trim()
      const agama = (row["Agama"] || "").toString().trim()
      const noTelpSiswa = (row["No Telepon Siswa"] || "").toString().trim()
      const tglLahirStr = (row["Tanggal Lahir (YYYY-MM-DD)"] || "").toString().trim()
      const email = (row["Email"] || "").toString().trim()
      const asalSekolah = (row["Asal Sekolah"] || "").toString().trim()
      const namaOrtu = (row["Nama Orang Tua"] || "").toString().trim()
      const noTelpOrtu = (row["No Telepon Ortu"] || "").toString().trim()
      const alamat = (row["Alamat Lengkap"] || "").toString().trim()
      const formNo = (row["No Formulir"] || "").toString().trim()
      const username = (row["Username"] || "").toString().trim()
      const isBeasiswa = (row["Beasiswa (YA)"] || "").toString().trim().toUpperCase() === "YA"

      if (!nis || !nama) {
        failedCount++
        errors.push({ row: rowNumber, msg: "Kolom NIS dan Nama Lengkap wajib diisi." })
        continue
      }

      // Parse Date if exists
      let birthDate = null
      if (tglLahirStr) {
        const parsedDate = new Date(tglLahirStr)
        if (!isNaN(parsedDate.getTime())) {
          birthDate = parsedDate
        }
      }

      // Check if NIS already exists
      const existing = await prisma.murid.findUnique({
        where: { nis }
      })

      if (existing) {
        failedCount++
        errors.push({ row: rowNumber, msg: `NIS ${nis} sudah terdaftar.` })
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create Murid
          const newMurid = await tx.murid.create({
            data: {
              nis,
              name: nama,
              nisn: nisn || null,
              gender: (jk === "Laki-laki" || jk === "Perempuan") ? jk : null,
              religion: agama || null,
              phone: noTelpSiswa || null,
              birthDate: birthDate,
              email: email || null,
              previousSchool: asalSekolah || null,
              parentName: namaOrtu || null,
              parentPhone: noTelpOrtu || null,
              address: alamat || null,
              formNo: formNo || null,
              username: username || null,
              isScholarship: isBeasiswa,
              unitSekolahId: unitId,
              isActive: true,
              status: "AKTIF"
            }
          })

          // 2. Create RiwayatKelas
          await tx.riwayatKelas.create({
            data: {
              muridId: newMurid.id,
              subKelasId: subKelasId,
              tahunAkademikId: activeTahun.id
            }
          })
        })

        successCount++
      } catch (err: any) {
        failedCount++
        errors.push({ row: rowNumber, msg: `Gagal menyimpan: ${err.message}` })
      }
    }

    if (successCount > 0) {
      await logAktivitas(
        session.user.id,
        "TAMBAH_MURID_MASSAL",
        `Berhasil impor ${successCount} data murid baru via CSV dengan data lengkap`
      )
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors
    })

  } catch (error: any) {
    console.error("Import Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
