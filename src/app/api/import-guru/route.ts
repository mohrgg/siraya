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

    if (!rawData || !unitId) {
      return NextResponse.json({ error: "Missing required fields (data or unitId)" }, { status: 400 })
    }

    const rows = JSON.parse(rawData)
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    let successCount = 0
    let failedCount = 0
    let errors: { row: number, msg: string }[] = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2 // +2 because Excel header is row 1, and array is 0-indexed
      const row = rows[i]

      // Extract raw fields mapped from CSV header
      const nama = (row["Nama Lengkap *"] || row["Nama Lengkap"] || "").toString().trim()
      let nip = (row["NIP"] || "").toString().trim()
      
      let jk = (row["Jenis Kelamin"] || "").toString().trim()
      if (jk.toUpperCase() === "L") jk = "Laki-laki"
      else if (jk.toUpperCase() === "P") jk = "Perempuan"

      const noTelp = (row["No Telepon"] || "").toString().trim()
      const email = (row["Email"] || "").toString().trim()
      const statusKepegawaian = (row["Status Kepegawaian *"] || row["Status Kepegawaian"] || "GTY").toString().trim()
      const pendidikan = (row["Pendidikan Terakhir"] || "").toString().trim()
      const bidangStudi = (row["Bidang Studi"] || "").toString().trim()
      
      const bankName = (row["Nama Bank"] || "").toString().trim()
      const bankAccount = (row["No Rekening"] || "").toString().trim()
      const bankAccountName = (row["Atas Nama Rekening"] || "").toString().trim()

      if (!nama) {
        failedCount++
        errors.push({ row: rowNumber, msg: "Kolom Nama Lengkap wajib diisi." })
        continue
      }
      
      if (!nip || nip === "-") {
        nip = null
      }

      try {
        await prisma.guru.create({
          data: {
            name: nama,
            nip: nip,
            gender: jk || null,
            phone: noTelp || null,
            email: email || null,
            statusKepegawaian: statusKepegawaian,
            pendidikan: pendidikan || null,
            bidangStudi: bidangStudi || null,
            bankName: bankName || null,
            bankAccount: bankAccount || null,
            bankAccountName: bankAccountName || null,
            unitSekolahId: unitId,
            isActive: true
          }
        })

        successCount++
      } catch (err: any) {
        failedCount++
        errors.push({ row: rowNumber, msg: `Gagal menyimpan: ${err.message}` })
      }
    }

    if (successCount > 0) {
      await logAktivitas(
        "TAMBAH_GURU_MASSAL",
        "MANAJEMEN_GURU",
        `Berhasil impor ${successCount} data guru baru via Excel`
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
