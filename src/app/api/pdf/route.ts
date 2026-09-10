import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import {
  ensureDeterministicLogo,
  renderHtmlToPdf,
  wrapHtmlWithPrintStyles,
} from "@/lib/pdf-browser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, data } = payload;

    // Pastikan logo dikonversi menjadi Base64 Data URI deterministik
    if (data?.institutionInfo?.logoUrl) {
      data.institutionInfo.logoUrl = ensureDeterministicLogo(
        data.institutionInfo.logoUrl,
        req.url
      );
    }

    let htmlBody = "";

    // Render komponen template ke static markup HTML
    if (type === "table") {
      const ReactDOMServer = await import("react-dom/server");
      const { TableReportHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(TableReportHtml, data as any)
      );
    } else if (type === "resi") {
      const ReactDOMServer = await import("react-dom/server");
      const { ResiHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(ResiHtml, data as any)
      );
    } else if (type === "jurnal") {
      const ReactDOMServer = await import("react-dom/server");
      const { JurnalHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(JurnalHtml, data as any)
      );
    } else if (type === "income_statement") {
      const ReactDOMServer = await import("react-dom/server");
      const { IncomeStatementHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(IncomeStatementHtml, data as any)
      );
    } else if (type === "mutasi-bank") {
      const ReactDOMServer = await import("react-dom/server");
      const { MutasiBankHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(MutasiBankHtml, data as any)
      );
    } else if (type === "tunggakan-matriks") {
      const ReactDOMServer = await import("react-dom/server");
      const { TunggakanMatriksHtml } = await import("@/lib/pdf-templates");
      htmlBody = (ReactDOMServer as any).renderToStaticMarkup(
        createElement(TunggakanMatriksHtml, data as any)
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported template type" },
        { status: 400 }
      );
    }

    // Bungkus dengan style print deterministik & @page CSS
    const fullHtml = wrapHtmlWithPrintStyles(htmlBody, data?.config);

    // Konversi HTML ke PDF Buffer via Chromium abstraction
    const pdfBuffer = await renderHtmlToPdf(fullHtml, data?.config);

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data?.filename || "export"}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
