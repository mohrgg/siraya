/**
 * Utility untuk memproses, me-resize, dan mengompresi gambar ke Base64 Data URI.
 * Menjaga aspek rasio dan transparansi (PNG/WebP/SVG), serta memastikan ukuran string
 * sangat efisien (~20KB - 80KB) untuk disimpan langsung ke database.
 */

export async function compressImageToBase64(
  file: File,
  maxDimension = 512,
  quality = 0.88
): Promise<string> {
  // 1. Jika berkas adalah SVG, baca langsung sebagai Data URL tanpa canvas
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  // 2. Untuk file raster (PNG, JPG, WebP), gunakan HTML5 Canvas untuk downscaling
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width = img.width
      let height = img.height

      // Hitung dimensi baru proporsional jika melebihi batas maksimal
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Gagal menginisialisasi Canvas Context 2D"))
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      // Gambar ke canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Tentukan format output (utamakan mempertahankan transparansi)
      let outputMime = file.type
      if (!outputMime || outputMime === "image/jpg") {
        outputMime = "image/jpeg"
      }

      const base64Data = canvas.toDataURL(outputMime, quality)
      resolve(base64Data)
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Gagal membaca berkas gambar"))
    }

    img.src = objectUrl
  })
}
