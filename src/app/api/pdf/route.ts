import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { createElement } from "react";
// Dynamic imports used inside the endpoint
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, data } = payload;

    // Handle logo for Playwright: Konversi file lokal di public/ ke Base64 Data URI agar tidak perlu roundtrip HTTP ke localhost
    if (data?.institutionInfo?.logoUrl) {
      const rawLogoUrl: string = data.institutionInfo.logoUrl;
      if (rawLogoUrl.startsWith('/')) {
        const fs = await import("fs");
        const path = await import("path");
        const cleanPath = rawLogoUrl.split('?')[0];
        const localFilePath = path.join(process.cwd(), "public", cleanPath);
        
        if (fs.existsSync(localFilePath)) {
          try {
            const ext = path.extname(localFilePath).toLowerCase().replace('.', '');
            const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            const fileBuffer = fs.readFileSync(localFilePath);
            data.institutionInfo.logoUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
          } catch (e) {
            console.warn("Gagal konversi logo ke base64, fallback ke URL absolut:", e);
            data.institutionInfo.logoUrl = new URL(rawLogoUrl, req.url).toString();
          }
        } else {
          data.institutionInfo.logoUrl = new URL(rawLogoUrl, req.url).toString();
        }
      }
    }

    let htmlBody = "";
    
    // Switch based on template type
    if (type === "table") {
      const ReactDOMServer = await import("react-dom/server");
      const { TableReportHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(TableReportHtml, data as any));
    } else if (type === "resi") {
      const ReactDOMServer = await import("react-dom/server");
      const { ResiHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(ResiHtml, data as any));
    } else if (type === "jurnal") {
      const ReactDOMServer = await import("react-dom/server");
      const { JurnalHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(JurnalHtml, data as any));
    } else if (type === "income_statement") {
      const ReactDOMServer = await import("react-dom/server");
      const { IncomeStatementHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(IncomeStatementHtml, data as any));
    } else if (type === "mutasi-bank") {
      const ReactDOMServer = await import("react-dom/server");
      const { MutasiBankHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(MutasiBankHtml, data as any));
    } else if (type === "tunggakan-matriks") {
      const ReactDOMServer = await import("react-dom/server");
      const { TunggakanMatriksHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(TunggakanMatriksHtml, data as any));
    } else {
      return NextResponse.json({ error: "Unsupported template type" }, { status: 400 });
    }

    const isA5 = data.config?.format === 'A5';
    const marginSize = data.config?.margin || (isA5 ? '8mm' : (data.config?.orientation === 'landscape' ? '10mm' : '15mm'));

    // Build the full HTML document with Tailwind CSS injected
    const fullHtml = `
      <!DOCTYPE html>
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
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              @page {
                size: ${data.config?.format || 'A4'} ${data.config?.orientation || 'portrait'};
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
        <body class="bg-white">
          ${htmlBody}
        </body>
      </html>
    `;

    // Launch Headless Chromium via Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set content and wait for network (to ensure Tailwind CSS is loaded from CDN)
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    
    // Render PDF
    const pdfBuffer = await page.pdf({
      format: (data.config?.format as any) || "A4",
      landscape: data.config?.orientation === "landscape",
      printBackground: true,
      margin: {
        top: marginSize,
        right: marginSize,
        bottom: marginSize,
        left: marginSize
      }
    });

    await browser.close();

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.filename || 'export'}.pdf"`
      },
    });
  } catch (error: any) {
    console.error("Playwright PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
