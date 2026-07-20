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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js"></script>
  <style>
    @page {
      size: ${options?.pageSize || "A4"} ${options?.orientation || "portrait"};
      margin: ${options?.margin === "narrow" ? "5mm" : options?.margin === "wide" ? "18mm" : "8mm"};
    }
    *, ::before, ::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #0f172a;
      font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.48;
      -webkit-font-smoothing: antialiased;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 100%;
      font-family: 'Inter', 'Roboto', sans-serif !important;
    }
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid-page !important;
      break-after: avoid !important;
    }
    h1 {
      font-size: 1.85em;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      text-align: center;
      margin-top: 0.2em;
      margin-bottom: 0.4em;
      padding-bottom: 0.25em;
      border-bottom: 2px solid #e2e8f0;
    }
    h2 {
      font-size: 1.25em;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: #1e293b;
      margin-top: 0.85em;
      margin-bottom: 0.25em;
      padding-bottom: 0.15em;
      border-bottom: 1px solid #f1f5f9;
    }
    h3 {
      font-size: 1.05em;
      font-weight: 600;
      color: #334155;
      margin-top: 0.65em;
      margin-bottom: 0.2em;
    }
    p {
      margin-top: 0;
      margin-bottom: 0.5em;
    }
    hr {
      height: 0;
      margin: 0.8em 0;
      border: 0;
      border-top: 1px solid #e2e8f0;
    }
    .katex-display {
      margin: 0.5em 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      break-inside: avoid !important;
    }
    .katex {
      font-size: 1.02em;
    }

    /* Flexbox & Helper Utilities for Code Block Window in Puppeteer */
    .flex { display: flex !important; }
    .items-center { align-items: center !important; }
    .justify-between { justify-content: space-between !important; }
    .gap-1\.5 { gap: 6px !important; }
    .w-2\.5 { width: 10px !important; }
    .h-2\.5 { height: 10px !important; }
    .rounded-full { border-radius: 9999px !important; }
    .inline-block { display: inline-block !important; }
    .uppercase { text-transform: uppercase !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }

    .code-window-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 5px 14px !important;
      background-color: #282828 !important;
      border-bottom: 1px solid #3c3836 !important;
      font-family: 'Roboto Mono', monospace !important;
      font-size: 10.5px !important;
      font-weight: bold !important;
      color: #fabd2f !important;
    }
    .code-dots-group {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .dot-red {
      width: 9px !important;
      height: 9px !important;
      border-radius: 50% !important;
      background-color: #fb4934 !important;
      display: inline-block !important;
    }
    .dot-yellow {
      width: 9px !important;
      height: 9px !important;
      border-radius: 50% !important;
      background-color: #fabd2f !important;
      display: inline-block !important;
    }
    .dot-green {
      width: 9px !important;
      height: 9px !important;
      border-radius: 50% !important;
      background-color: #b8bb26 !important;
      display: inline-block !important;
    }
    
    /* Gruvbox Dark Code Block Styling */
    .markdown-body pre {
      background-color: #1d2021 !important;
      border: 1px solid #3c3836 !important;
      border-radius: 8px !important;
      padding: 0 !important;
      margin: 0.75em 0 !important;
      color: #ebdbb2 !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      font-family: 'Roboto Mono', ui-monospace, monospace !important;
    }
    .markdown-body pre code {
      background-color: #1d2021 !important;
      color: #ebdbb2 !important;
      padding: 10px 12px !important;
      display: block !important;
      font-family: 'Roboto Mono', ui-monospace, monospace !important;
      font-size: 11px !important;
      line-height: 1.45 !important;
    }
    .markdown-body pre code span {
      color: #ebdbb2;
    }
    
    /* Gruvbox Token Highlighting Specificity */
    .markdown-body pre code .hljs-keyword,
    .markdown-body pre code .hljs-selector-tag,
    .markdown-body pre code .hljs-subst,
    .markdown-body pre code .hljs-meta {
      color: #fb4934 !important;
      font-weight: 600 !important;
    }
    .markdown-body pre code .hljs-string,
    .markdown-body pre code .hljs-title,
    .markdown-body pre code .hljs-section,
    .markdown-body pre code .hljs-attribute,
    .markdown-body pre code .hljs-literal,
    .markdown-body pre code .hljs-template-tag,
    .markdown-body pre code .hljs-template-variable,
    .markdown-body pre code .hljs-type {
      color: #b8bb26 !important;
    }
    .markdown-body pre code .hljs-comment,
    .markdown-body pre code .hljs-quote,
    .markdown-body pre code .hljs-deletion {
      color: #928374 !important;
      font-style: italic !important;
    }
    .markdown-body pre code .hljs-number,
    .markdown-body pre code .hljs-symbol,
    .markdown-body pre code .hljs-bullet,
    .markdown-body pre code .hljs-link {
      color: #d3869b !important;
    }
    .markdown-body pre code .hljs-title.function_,
    .markdown-body pre code .hljs-function .hljs-title,
    .markdown-body pre code .hljs-name {
      color: #8ec07c !important;
      font-weight: 600 !important;
    }
    .markdown-body pre code .hljs-variable,
    .markdown-body pre code .hljs-attr,
    .markdown-body pre code .hljs-params,
    .markdown-body pre code .hljs-property {
      color: #83a598 !important;
    }
    .markdown-body pre code .hljs-built_in,
    .markdown-body pre code .hljs-class .hljs-title {
      color: #fabd2f !important;
    }

    blockquote {
      border-left: 4px solid #0284c7 !important;
      color: #0369a1 !important;
      background-color: #f0f9ff !important;
      border-radius: 0 8px 8px 0 !important;
      padding: 5px 12px !important;
      margin: 0.75em 0 !important;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.75em 0;
      break-inside: avoid;
    }
    table th, table td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
    }
    table th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #334155;
    }
    img {
      max-width: 100%;
      max-height: 240px;
      height: auto;
      border-radius: 8px;
      margin: 0.6em auto;
      display: block;
      break-inside: avoid;
    }
    .mermaid-wrapper {
      margin: 0.75em 0 !important;
      padding: 8px !important;
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      break-inside: avoid !important;
    }
    .mermaid-wrapper svg {
      max-height: 230px !important;
      width: auto !important;
      margin: 0 auto !important;
      display: block !important;
      background-color: #ffffff !important;
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

    const marginValue = options?.margin === "narrow" ? "5mm" : options?.margin === "wide" ? "18mm" : "8mm";
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
