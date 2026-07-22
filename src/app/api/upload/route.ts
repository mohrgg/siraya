import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "general"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate Size (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg"
    const uniqueId = crypto.randomBytes(8).toString("hex")
    const fileName = `${Date.now()}-${uniqueId}${ext}`
    
    // Save to disk
    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${folder}/${fileName}`
    
    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
