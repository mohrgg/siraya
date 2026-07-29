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
    const subKelasId = (formData.get("subKelasId") || "") as string

    if (!rawData || !unitId) {
      return NextResponse.json({ error: "Missing required fields (data or unitId)" }, { status: 400 })
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
      const nis = (row["NIS *"] || row["NIS"] || "").toString().trim()
      const nama = (row["Nama Lengkap *"] || row["Nama Lengkap"] || "").toString().trim()
      const nisn = (row["NISN"] || "").toString().trim()
      const targetSubKelasId = (row["ID Sub Kelas (Opsional)"] || row["ID Sub Kelas"] || subKelasId || "").toString().trim()
      
      let jk = (row["Jenis Kelamin"] || "").toString().trim()
      if (jk.toUpperCase() === "L") jk = "Laki-laki"
      else if (jk.toUpperCase() === "P") jk = "Perempuan"

      const agama = (row["Agama"] || "").toString().trim()
      const tempatLahir = (row["Tempat Lahir"] || "").toString().trim()
      const tglLahirStr = (row["Tanggal Lahir (YYYY-MM-DD)"] || "").toString().trim()
      const nik = (row["NIK"] || "").toString().trim()
      const namaAyah = (row["Nama Ayah"] || "").toString().trim()
      const namaIbu = (row["Nama Ibu"] || "").toString().trim()
      const pekAyah = (row["Pekerjaan Ayah"] || "").toString().trim()
      const pekIbu = (row["Pekerjaan Ibu"] || "").toString().trim()
      const noTelpOrtu = (row["No Telepon Ortu"] || "").toString().trim()
      
      const alamat = (row["Alamat Jalan"] || "").toString().trim()
      const rt = (row["RT"] || "").toString().trim()
      const rw = (row["RW"] || "").toString().trim()
      const kel = (row["Kelurahan"] || "").toString().trim()
      const kec = (row["Kecamatan"] || "").toString().trim()
      
      // Keep old fields just in case they use old template
      const noTelpSiswa = (row["No Telepon Siswa"] || "").toString().trim()
      const email = (row["Email"] || "").toString().trim()
      const asalSekolah = (row["Asal Sekolah"] || "").toString().trim()
      const formNo = (row["No Formulir"] || "").toString().trim()
      const username = (row["Username"] || "").toString().trim()
      const isBeasiswa = (row["Beasiswa (YA)"] || "").toString().trim().toUpperCase() === "YA"

      if (!nama) {
        failedCount++
        errors.push({ row: rowNumber, msg: "Kolom Nama Lengkap wajib diisi." })
        continue
      }

      if (!targetSubKelasId) {
        failedCount++
        errors.push({ row: rowNumber, msg: "Rombel/Kelas tujuan tidak ditentukan (kosong di Excel & di pilihan default)." })
        continue
      }

      // Parse Date if exists
      let birthDate = null
      if (tglLahirStr) {
        if (/^\d+$/.test(tglLahirStr)) {
          // Handle Excel serial date
          const serial = parseInt(tglLahirStr, 10)
          const utc_days  = Math.floor(serial - 25569)
          const utc_value = utc_days * 86400
          birthDate = new Date(utc_value * 1000)
        } else {
          const parsedDate = new Date(tglLahirStr)
          if (!isNaN(parsedDate.getTime())) {
            birthDate = parsedDate
          }
        }
      }

      // Check if NIS already exists, if provided
      let finalNis = nis
      if (!finalNis || finalNis === "-") {
        finalNis = null
      }

      if (finalNis) {
        const existing = await prisma.murid.findUnique({
          where: { nis: finalNis }
        })

        if (existing) {
          failedCount++
          errors.push({ row: rowNumber, msg: `NIS ${finalNis} sudah terdaftar.` })
          continue
        }
      }

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create Murid
          const newMurid = await tx.murid.create({
            data: {
              nis: finalNis,
              name: nama,
              nisn: nisn || null,
              gender: jk || null,
              religion: agama || null,
              phone: noTelpSiswa || null,
              birthPlace: tempatLahir || null,
              birthDate: birthDate,
              nik: nik || null,
              email: email || null,
              previousSchool: asalSekolah || null,
              fatherName: namaAyah || (row["Nama Orang Tua"] || "").toString().trim() || null,
              motherName: namaIbu || null,
              fatherOccupation: pekAyah || null,
              motherOccupation: pekIbu || null,
              parentPhone: noTelpOrtu || null,
              address: alamat || (row["Alamat Lengkap"] || "").toString().trim() || null,
              rt: rt || null,
              rw: rw || null,
              village: kel || null,
              district: kec || null,
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
              subKelasId: targetSubKelasId,
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
        "TAMBAH_MURID_MASSAL",
        "MANAJEMEN_MURID",
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
