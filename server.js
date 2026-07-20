const express = require('express');
const path = require('path');
const { mdToPdf } = require('md-mermaid-pdf');
const katex = require('katex');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Pre-render KaTeX math to HTML
function renderKaTeX(md) {
  let result = md;

  // Display math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Block math \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Inline math $...$  (not $$)
  result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  // Inline math \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });

  return result;
}

// PDF generation
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { markdown, title } = req.body;

    if (!markdown?.trim()) {
      return res.status(400).json({ error: 'No markdown provided' });
    }

    // Pre-render KaTeX math to HTML
    const withMath = renderKaTeX(markdown);

    const pdf = await mdToPdf(
      { content: withMath },
      {
        launch_options: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="width:100%;padding:8px 40px;font-size:9px;color:#888;font-family:system-ui,sans-serif;display:flex;justify-content:space-between;">
              <span>${(title || 'Document').replace(/</g, '&lt;')}</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>`,
          footerTemplate: `
            <div style="width:100%;padding:8px 40px;font-size:9px;color:#888;font-family:system-ui,sans-serif;text-align:center;">
              Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>`
        },
        stylesheet: [
          'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-light.min.css'
        ],
        css: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #1a1a1a;
          }
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 900px;
            margin: 0 auto;
            padding: 0;
          }
          pre { margin-top: 0 !important; }
          p + pre, pre + p { margin-top: 0 !important; }
          pre {
            background: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 12px 14px;
            overflow-x: auto;
            font-size: 10.5px;
            line-height: 1.5;
            page-break-inside: avoid;
          }
          pre code {
            background: transparent !important;
            padding: 0;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 10.5px;
            color: #24292f;
          }
          pre .token.comment, pre .token.prolog, pre .token.doctype, pre .token.cdata { color: #6a737d; }
          pre .token.punctuation { color: #24292f; }
          pre .token.property, pre .token.tag, pre .token.boolean, pre .token.number, pre .token.constant, pre .token.symbol, pre .token.deleted { color: #005cc5; }
          pre .token.selector, pre .token.attr-name, pre .token.string, pre .token.char, pre .token.builtin, pre .token.inserted { color: #22863a; }
          pre .token.operator, pre .token.entity, pre .token.url { color: #d73a49; }
          pre .token.atrule, pre .token.attr-value, pre .token.keyword { color: #d73a49; }
          pre .token.function, pre .token.class-name { color: #6f42c1; }
          pre .token.regex, pre .token.important, pre .token.variable { color: #e36209; }
          code {
            background: rgba(175,184,193,0.2);
            border-radius: 4px;
            padding: 0.2em 0.4em;
            font-size: 85%;
            color: #d63384;
          }
          img { max-width: 100%; height: auto; border-radius: 6px; }
          blockquote {
            border-left: 4px solid #0969da;
            padding: 2px 16px;
            color: #57606a;
            background: #f0f7ff;
            border-radius: 0 6px 6px 0;
            margin: 8px 0;
          }
          table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
          th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
          th { background: #f6f8fa; font-weight: 600; }
          h1, h2, h3, h4 { margin-top: 20px; margin-bottom: 12px; font-weight: 600; line-height: 1.25; }
          h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
          h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
          hr { border: none; border-top: 2px solid #d0d7de; margin: 12px 0; }
          p:last-child { page-break-inside: avoid; }
          .mermaid { text-align: center; margin: 16px 0; padding: 12px; background: #fafbfc; border: 1px solid #d0d7de; border-radius: 6px; }
          .mermaid svg { max-width: 100%; height: auto; }
          .katex-display { margin: 16px 0 !important; text-align: center; }
          .katex-display > .katex { font-size: 1.15em; }
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
});

app.listen(PORT, () => {
  console.log(`\n  md2pdf dev server → http://localhost:${PORT}\n`);
});
