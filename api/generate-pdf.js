const { mdToPdf } = require('md-mermaid-pdf');
const katex = require('katex');

// Pre-render KaTeX math to HTML
function renderKaTeX(md) {
  let result = md;

  // Display math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return `\n\n<div class="katex-display-wrapper">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html' })}</div>\n\n`;
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Block math \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    try {
      return `\n\n<div class="katex-display-wrapper">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html' })}</div>\n\n`;
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Inline math $...$ (not $$)
  result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html' });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Inline math \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html' });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  return result;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { markdown, title } = req.body;

    if (!markdown?.trim()) {
      return res.status(400).json({ error: 'No markdown provided' });
    }

    const withMath = renderKaTeX(markdown);

    const pdf = await mdToPdf(
      { content: withMath },
      {
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        pdf_options: {
          format: 'A4',
          margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="width:100%;padding:0 20mm;font-size:8pt;color:#999;font-family:'Georgia',serif;display:flex;justify-content:space-between;border-bottom:0.5pt solid #ddd;padding-bottom:4pt;margin-top:0;">
              <span style="font-style:italic;">${(title || 'Document').replace(/</g, '&lt;')}</span>
              <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>`,
          footerTemplate: `
            <div style="width:100%;padding:0 20mm;font-size:8pt;color:#999;font-family:'Georgia',serif;text-align:center;border-top:0.5pt solid #ddd;padding-top:4pt;">
              — <span class="pageNumber"></span> / <span class="totalPages"></span> —
            </div>`
        },
        stylesheet: [],
        css: `
          /* ═══════════════════════════════════════════════════════════
             RESEARCH PAPER STYLESHEET
             Professional academic typography for PDF output
             ═══════════════════════════════════════════════════════════ */

          @page {
            size: A4;
            margin: 25mm 20mm 25mm 20mm;
          }

          body {
            font-family: 'Georgia', 'Times New Roman', 'Noto Serif', serif;
            font-size: 10.5pt;
            line-height: 1.55;
            color: #1a1a1a;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          .markdown-body {
            box-sizing: border-box;
            min-width: 0;
            max-width: 100%;
            margin: 0;
            padding: 0;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
          }

          /* ── Headings ─────────────────────────────────────────── */
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-weight: 700;
            color: #111;
            line-height: 1.25;
            margin: 0;
            padding: 0;
            page-break-after: avoid;
          }

          h1 {
            font-size: 20pt;
            margin-top: 0;
            margin-bottom: 6pt;
            padding-bottom: 6pt;
            border-bottom: 1.5pt solid #333;
            text-align: center;
            letter-spacing: -0.3pt;
          }

          h2 {
            font-size: 14pt;
            margin-top: 24pt;
            margin-bottom: 8pt;
            padding-bottom: 4pt;
            border-bottom: 0.75pt solid #ccc;
            letter-spacing: -0.2pt;
          }

          h3 {
            font-size: 11.5pt;
            margin-top: 18pt;
            margin-bottom: 6pt;
            font-style: italic;
          }

          h4 {
            font-size: 10.5pt;
            margin-top: 14pt;
            margin-bottom: 4pt;
          }

          /* ── Body Text ────────────────────────────────────────── */
          p {
            margin: 0 0 8pt 0;
            text-align: justify;
            hyphens: auto;
            -webkit-hyphens: auto;
          }

          strong { font-weight: 700; }
          em { font-style: italic; }

          /* ── Links ────────────────────────────────────────────── */
          a {
            color: #1a5276;
            text-decoration: none;
            border-bottom: 0.5pt solid #1a5276;
          }

          /* ── Lists ────────────────────────────────────────────── */
          ul, ol {
            margin: 4pt 0 8pt 0;
            padding-left: 22pt;
          }

          li {
            margin-bottom: 3pt;
            line-height: 1.5;
          }

          li > p {
            margin: 0;
          }

          /* ── Blockquote ───────────────────────────────────────── */
          blockquote {
            margin: 12pt 0;
            padding: 8pt 16pt;
            border-left: 2.5pt solid #555;
            background: transparent;
            color: #333;
            font-style: italic;
            border-radius: 0;
          }

          blockquote p {
            margin: 0;
            text-align: left;
          }

          /* ── Horizontal Rule ──────────────────────────────────── */
          hr {
            border: none;
            border-top: 0.5pt solid #ccc;
            margin: 16pt 0;
          }

          /* ── Code ─────────────────────────────────────────────── */
          code {
            font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace;
            font-size: 8.5pt;
            background: #f5f5f5;
            padding: 1pt 3pt;
            border-radius: 2pt;
            color: #c7254e;
          }

          pre {
            margin: 10pt 0;
            padding: 10pt 12pt;
            background: #f8f8f8;
            border: 0.5pt solid #e0e0e0;
            border-radius: 3pt;
            overflow-x: auto;
            page-break-inside: avoid;
            line-height: 1.45;
          }

          pre code {
            font-size: 8pt;
            color: #333;
            background: transparent;
            padding: 0;
            border-radius: 0;
          }

          /* Syntax tokens */
          pre .token.comment, pre .token.prolog, pre .token.doctype, pre .token.cdata { color: #6a737d; font-style: italic; }
          pre .token.punctuation { color: #24292f; }
          pre .token.property, pre .token.tag, pre .token.boolean, pre .token.number, pre .token.constant, pre .token.symbol, pre .token.deleted { color: #005cc5; }
          pre .token.selector, pre .token.attr-name, pre .token.string, pre .token.char, pre .token.builtin, pre .token.inserted { color: #22863a; }
          pre .token.operator, pre .token.entity, pre .token.url { color: #d73a49; }
          pre .token.atrule, pre .token.attr-value, pre .token.keyword { color: #d73a49; }
          pre .token.function, pre .token.class-name { color: #6f42c1; }
          pre .token.regex, pre .token.important, pre .token.variable { color: #e36209; }

          /* ── Tables ───────────────────────────────────────────── */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
            font-size: 9.5pt;
            page-break-inside: avoid;
          }

          thead th {
            background: #f0f0f0;
            font-weight: 700;
            border-top: 1.5pt solid #333;
            border-bottom: 1pt solid #333;
            padding: 6pt 10pt;
            text-align: left;
          }

          tbody td {
            border-bottom: 0.5pt solid #ddd;
            padding: 5pt 10pt;
            text-align: left;
          }

          tbody tr:last-child td {
            border-bottom: 1.5pt solid #333;
          }

          /* ── Images ───────────────────────────────────────────── */
          img {
            display: block;
            max-width: 85%;
            height: auto;
            margin: 12pt auto;
            border-radius: 0;
          }

          /* ── KaTeX Math ───────────────────────────────────────── */
          .katex-display-wrapper {
            margin: 14pt 0;
            text-align: center;
            page-break-inside: avoid;
          }

          .katex-display {
            margin: 0 !important;
            text-align: center;
          }

          .katex-display > .katex {
            font-size: 1.1em;
            color: #111;
          }

          .katex {
            font-size: 1em;
            color: #111;
          }

          .katex-error {
            color: #c62828;
            font-family: 'Consolas', monospace;
            font-size: 9pt;
            background: #ffebee;
            padding: 2pt 4pt;
            border-radius: 2pt;
          }

          /* ── Mermaid Diagrams ─────────────────────────────────── */
          .mermaid {
            text-align: center;
            margin: 16pt 0;
            padding: 12pt;
            background: #fafafa;
            border: 0.5pt solid #e0e0e0;
            border-radius: 3pt;
            page-break-inside: avoid;
          }

          .mermaid svg {
            max-width: 90%;
            height: auto;
            display: block;
            margin: 0 auto;
          }

          /* ── Figure Captions ──────────────────────────────────── */
          img + em,
          img + em + br + em {
            display: block;
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: -8pt;
          }

          /* ── Utility ──────────────────────────────────────────── */
          sub { font-size: 75%; vertical-align: sub; }
          sup { font-size: 75%; vertical-align: super; }

          mark {
            background: #fff3cd;
            padding: 0 2pt;
          }

          /* Page break hints */
          h2, h3, h4 {
            page-break-after: avoid;
          }

          pre, table, blockquote, .mermaid, .katex-display-wrapper {
            page-break-inside: avoid;
          }
        `,
        mermaidCdnUrl: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
      }
    );

    if (!pdf?.content) {
      return res.status(500).json({ error: 'PDF generation returned nothing' });
    }

    const buf = Buffer.from(pdf.content);
    const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.send(buf);

  } catch (err) {
    console.error('PDF error:', err.message || err);
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
};
