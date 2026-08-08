import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { createElement } from "react";
import { TableReportHtml, TableReportData } from "@/lib/pdf-templates";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, data } = payload;

    // Pastikan URL logo absolut (beserta domain) agar Playwright bisa me-load gambarnya
    if (data?.institutionInfo?.logoUrl?.startsWith('/')) {
      data.institutionInfo.logoUrl = new URL(data.institutionInfo.logoUrl, req.url).toString();
    }

    let htmlBody = "";
    
    // Switch based on template type
    if (type === "table") {
      const ReactDOMServer = await import("react-dom/server");
      const tableData = data as TableReportData;
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(createElement(TableReportHtml, tableData as any));
    } else {
      return NextResponse.json({ error: "Unsupported template type" }, { status: 400 });
    }

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
            @media print {
              @page {
                size: ${data.config?.orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
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
      format: "A4",
      landscape: data.config?.orientation === "landscape",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
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
