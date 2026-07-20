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
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js"></script>
  <style>
    @page {
      size: ${options?.pageSize || "A4"} ${options?.orientation || "portrait"};
      margin: ${options?.margin === "narrow" ? "8mm" : options?.margin === "wide" ? "25mm" : "12mm"};
    }
    *, ::before, ::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 100%;
    }
    h1 {
      font-size: 2.1em;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #0f172a;
      text-align: center;
      margin-top: 0.5em;
      margin-bottom: 0.6em;
      padding-bottom: 0.4em;
      border-bottom: 2px solid #e2e8f0;
    }
    h2 {
      font-size: 1.35em;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: #1e293b;
      margin-top: 1.25em;
      margin-bottom: 0.4em;
      padding-bottom: 0.25em;
      border-bottom: 1px solid #f1f5f9;
      break-after: avoid;
    }
    h3 {
      font-size: 1.1em;
      font-weight: 600;
      color: #334155;
      margin-top: 1em;
      margin-bottom: 0.3em;
      break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 0.7em;
    }
    hr {
      height: 0;
      margin: 1.25em 0;
      border: 0;
      border-top: 1px solid #e2e8f0;
    }
    .katex-display {
      margin: 1em 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      break-inside: avoid !important;
    }
    .katex {
      font-size: 1.05em;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    }
    pre {
      background-color: #1d2021 !important;
      border: 1px solid #3c3836 !important;
      border-radius: 8px !important;
      padding: 0 !important;
      margin: 1em 0 !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
      break-inside: avoid !important;
    }
    pre code {
      background-color: #1d2021 !important;
      color: #ebdbb2 !important;
      padding: 14px 16px !important;
      display: block;
    }
    /* Gruvbox Syntax Highlighting Tokens */
    .hljs-keyword, .hljs-selector-tag, .hljs-subst, .hljs-meta {
      color: #fb4934 !important;
      font-weight: 600;
    }
    .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type {
      color: #b8bb26 !important;
    }
    .hljs-comment, .hljs-quote, .hljs-deletion {
      color: #928374 !important;
      font-style: italic;
    }
    .hljs-number, .hljs-symbol, .hljs-bullet, .hljs-link {
      color: #d3869b !important;
    }
    .hljs-title.function_, .hljs-function .hljs-title, .hljs-name {
      color: #8ec07c !important;
      font-weight: 600;
    }
    .hljs-variable, .hljs-attr, .hljs-params {
      color: #83a598 !important;
    }
    .hljs-built_in, .hljs-class .hljs-title {
      color: #fabd2f !important;
    }

    blockquote {
      border-left: 4px solid #0284c7 !important;
      color: #0369a1 !important;
      background-color: #f0f9ff !important;
      border-radius: 0 8px 8px 0 !important;
      padding: 8px 16px !important;
      margin: 1em 0 !important;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      break-inside: avoid;
    }
    table th, table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
    }
    table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #334155;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em auto;
      display: block;
      break-inside: avoid;
    }
    .mermaid-wrapper {
      margin: 1.25em 0;
      padding: 16px;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      break-inside: avoid !important;
    }
    tr {
      break-inside: avoid !important;
    }
  </style>
</head>
<body class="markdown-body">
  ${html}
</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });

    const marginValue = options?.margin === "narrow" ? "8mm" : options?.margin === "wide" ? "25mm" : "12mm";
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
