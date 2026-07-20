import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { html, title, options } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "No HTML content provided" }, { status: 400 });
    }

    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title || "Document"}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css" />
  <style>
    *, ::before, ::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 30px 40px;
      background-color: #ffffff;
      color: #1f2328;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 100%;
    }
    .katex-display {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      margin: 1.25em 0 !important;
    }
    .katex {
      font-size: 1.05em;
    }
    pre, code, blockquote, table, tr, img, .mermaid-wrapper, svg {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    pre {
      background-color: #f6f8fa !important;
      border: 1px solid #d0d7de !important;
      border-radius: 6px !important;
      padding: 16px !important;
    }
    blockquote {
      border-left: 4px solid #0969da !important;
      color: #57606a !important;
      background-color: #f6f8fa !important;
      padding: 8px 16px !important;
      margin: 16px 0 !important;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    table th, table td {
      border: 1px solid #d0d7de;
      padding: 8px 12px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
  </style>
</head>
<body class="markdown-body">
  ${html}
</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });

    const marginValue = options?.margin === "narrow" ? "8mm" : options?.margin === "wide" ? "25mm" : "15mm";
    const format = options?.pageSize || "A4";

    const pdfBuffer = await page.pdf({
      format: format as any,
      landscape: options?.orientation === "landscape",
      printBackground: true,
      margin: {
        top: marginValue,
        right: marginValue,
        bottom: marginValue,
        left: marginValue,
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(title || "document").replace(/[^a-z0-9_-]/gi, "_")}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Puppeteer PDF generation error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate PDF" }, { status: 500 });
  }
}
