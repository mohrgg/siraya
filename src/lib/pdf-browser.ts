import type { Browser } from "puppeteer-core";
import fs from "fs";
import path from "path";

export interface PdfRenderOptions {
  format?: "A4" | "A5" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margin?: string;
  filename?: string;
}

/**
 * Mendapatkan instance browser Chromium yang sesuai dengan runtime saat ini:
 * - Vercel Serverless / AWS Lambda: menggunakan @sparticuz/chromium + puppeteer-core (native serverless pairing tanpa dependensi browsers.json)
 * - VPS Linux: mendeteksi binary chromium-browser / google-chrome sistem
 * - Local macOS / Windows: menggunakan Google Chrome lokal atau channel 'chrome'
 */
export async function getBrowser(): Promise<Browser> {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath();
    return await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  // Lingkungan Non-Serverless (VPS Linux, Docker, macOS, Windows)
  const puppeteer = (await import("puppeteer-core")).default;

  // 1. Cek environment variable custom (umum pada container Docker / VPS)
  const customExecutable = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH;
  if (customExecutable && fs.existsSync(customExecutable)) {
    return await puppeteer.launch({
      executablePath: customExecutable,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }

  // 2. Cek path standar Chromium di VPS Linux (Ubuntu / Debian / Alpine)
  if (process.platform === "linux") {
    const standardLinuxPaths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/snap/bin/chromium",
    ];

    for (const p of standardLinuxPaths) {
      if (fs.existsSync(p)) {
        return await puppeteer.launch({
          executablePath: p,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
      }
    }
  }

  // 3. Local macOS: utamakan aplikasi Google Chrome lokal
  const macChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(macChromePath)) {
    try {
      return await puppeteer.launch({
        executablePath: macChromePath,
        headless: true,
      });
    } catch {
      // fallback ke channel chrome
    }
  }

  // 4. Fallback channel 'chrome' atau default
  try {
    return await puppeteer.launch({ channel: "chrome", headless: true });
  } catch {
    return await puppeteer.launch({ headless: true });
  }
}

/**
 * Menjamin URL logo lokal dikonversi menjadi Data URI Base64 deterministik.
 * Menghindari dependensi request HTTP internal/loopback saat proses render PDF.
 */
export function ensureDeterministicLogo(logoUrl?: string, reqBaseUrl?: string): string | undefined {
  if (!logoUrl) return undefined;

  if (logoUrl.startsWith("data:")) {
    return logoUrl;
  }

  if (logoUrl.startsWith("/")) {
    const cleanPath = logoUrl.split("?")[0];
    const localFilePath = path.join(process.cwd(), "public", cleanPath);

    if (fs.existsSync(localFilePath)) {
      try {
        const ext = path.extname(localFilePath).toLowerCase().replace(".", "");
        const mimeType =
          ext === "svg"
            ? "image/svg+xml"
            : ext === "png"
            ? "image/png"
            : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
        const fileBuffer = fs.readFileSync(localFilePath);
        return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      } catch (e) {
        console.warn("Gagal konversi logo ke base64:", e);
      }
    }

    if (reqBaseUrl) {
      try {
        return new URL(logoUrl, reqBaseUrl).toString();
      } catch {
        return logoUrl;
      }
    }
  }

  return logoUrl;
}

/**
 * Membungkus markup HTML dokumen dengan stylesheet print deterministik,
 * Tailwind CSS CDN, dan aturan @page layout.
 */
export function wrapHtmlWithPrintStyles(htmlBody: string, options?: PdfRenderOptions): string {
  const format = options?.format || "A4";
  const orientation = options?.orientation || "portrait";
  const isA5 = format === "A5";
  const marginSize = options?.margin || (isA5 ? "8mm" : orientation === "landscape" ? "10mm" : "15mm");

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Export PDF</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @media print {
        @page {
          size: ${format} ${orientation};
          margin: ${marginSize};
        }
      }
      tr, .avoid-break, .break-inside-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
      tfoot {
        display: table-footer-group !important;
      }
    </style>
  </head>
  <body class="bg-white text-slate-900">
    ${htmlBody}
  </body>
</html>`;
}

/**
 * Mengonversi string HTML lengkap menjadi Buffer file PDF menggunakan Chromium.
 * Mengikuti best practice serverless:
 * 1. Single browser instance per request
 * 2. Menunggu domcontentloaded, networkidle, dan document.fonts.ready sebelum capture
 * 3. printBackground: true
 * 4. Browser SELALU ditutup dalam blok finally
 */
export async function renderHtmlToPdf(fullHtml: string, options?: PdfRenderOptions): Promise<Buffer> {
  let browser: Browser | null = null;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // 1. Set konten HTML
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });

    // 2. Tunggu Tailwind CDN selesai di-download jika ada
    await page.waitForNetworkIdle({ idleTime: 150, timeout: 4000 }).catch(() => {});

    // 3. Tunggu seluruh font web/sistem selesai di-render secara deterministik
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const isA5 = options?.format === "A5";
    const marginSize = options?.margin || (isA5 ? "8mm" : options?.orientation === "landscape" ? "10mm" : "15mm");

    // 4. Render ke PDF dengan printBackground true
    const uint8Array = await page.pdf({
      format: (options?.format as any) || "A4",
      landscape: options?.orientation === "landscape",
      printBackground: true,
      margin: {
        top: marginSize,
        right: marginSize,
        bottom: marginSize,
        left: marginSize,
      },
    });

    return Buffer.from(uint8Array);
  } finally {
    // 5. Selalu pastikan browser ditutup untuk mencegah kebocoran proses/memori
    if (browser) {
      await browser.close().catch((err) => {
        console.warn("Gagal menutup browser Chromium:", err);
      });
    }
  }
}
