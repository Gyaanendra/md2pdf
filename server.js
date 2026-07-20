const express = require('express');
const path = require('path');
const katex = require('katex');

// Load mhchem extension for chemistry equations
require('katex/contrib/mhchem/mhchem.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

function renderKaTeX(md) {
  let result = md;

  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return '\n\n<div class="math-display">' + katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html', strict: false, trust: true }) + '</div>\n\n';
    } catch { return '<span class="katex-error">' + tex + '</span>'; }
  });

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    try {
      return '\n\n<div class="math-display">' + katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html', strict: false, trust: true }) + '</div>\n\n';
    } catch { return '<span class="katex-error">' + tex + '</span>'; }
  });

  result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html', strict: false, trust: true });
    } catch { return '<span class="katex-error">' + tex + '</span>'; }
  });

  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html', strict: false, trust: true });
    } catch { return '<span class="katex-error">' + tex + '</span>'; }
  });

  return result;
}

const MARGINS = {
  normal: { top: '22mm', right: '18mm', bottom: '22mm', left: '18mm' },
  narrow: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
  wide: { top: '25mm', right: '30mm', bottom: '25mm', left: '30mm' }
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.65;
  color: #1e1e1e;
}

.markdown-body { box-sizing: border-box; min-width: 0; max-width: 100%; margin: 0; padding: 0; font-family: inherit; font-size: inherit; line-height: inherit; }

h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: #111;
  line-height: 1.3;
  margin: 0;
  page-break-after: avoid;
}

h1 { font-size: 22pt; margin-bottom: 8pt; padding-bottom: 8pt; border-bottom: 2px solid #e0e0e0; text-align: center; }
h2 { font-size: 16pt; margin-top: 22pt; margin-bottom: 8pt; padding-bottom: 4pt; border-bottom: 1px solid #eee; }
h3 { font-size: 13pt; margin-top: 16pt; margin-bottom: 6pt; }
h4 { font-size: 11.5pt; margin-top: 12pt; margin-bottom: 4pt; font-weight: 600; }

p { margin: 0 0 8pt 0; text-align: justify; }
a { color: #2563eb; text-decoration: none; }

ul, ol { margin: 4pt 0 8pt 0; padding-left: 20pt; }
li { margin-bottom: 3pt; }
li > p { margin: 0; }

blockquote {
  margin: 10pt 0;
  padding: 8pt 14pt;
  border-left: 3px solid #ddd;
  background: #fafafa;
  color: #555;
  border-radius: 0 4px 4px 0;
}
blockquote p { margin: 0; text-align: left; }

hr { border: none; border-top: 1px solid #e0e0e0; margin: 14pt 0; }

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
  color: #e11d48;
}

pre {
  margin: 10pt 0;
  padding: 10pt 12pt;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow-x: auto;
  page-break-inside: avoid;
  line-height: 1.5;
}
pre code { font-size: 8.5pt; color: #374151; background: transparent; padding: 0; border-radius: 0; }

pre .token.comment, pre .token.prolog, pre .token.doctype, pre .token.cdata { color: #9ca3af; font-style: italic; }
pre .token.punctuation { color: #374151; }
pre .token.property, pre .token.tag, pre .token.boolean, pre .token.number, pre .token.constant, pre .token.symbol, pre .token.deleted { color: #2563eb; }
pre .token.selector, pre .token.attr-name, pre .token.string, pre .token.char, pre .token.builtin, pre .token.inserted { color: #059669; }
pre .token.operator, pre .token.entity, pre .token.url { color: #dc2626; }
pre .token.atrule, pre .token.attr-value, pre .token.keyword { color: #dc2626; }
pre .token.function, pre .token.class-name { color: #7c3aed; }
pre .token.regex, pre .token.important, pre .token.variable { color: #ea580c; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0;
  font-size: 10pt;
  page-break-inside: avoid;
}
thead th {
  background: #f9fafb;
  font-weight: 600;
  border-top: 1.5px solid #d1d5db;
  border-bottom: 1.5px solid #d1d5db;
  padding: 6pt 10pt;
  text-align: left;
}
tbody td {
  border-bottom: 1px solid #e5e7eb;
  padding: 5pt 10pt;
}
tbody tr:last-child td { border-bottom: 1.5px solid #d1d5db; }

img {
  display: block;
  max-width: 70%;
  height: auto;
  margin: 12pt auto;
  border-radius: 4px;
}

.math-display {
  margin: 12pt 0;
  text-align: center;
  page-break-inside: avoid;
  overflow-x: auto;
  overflow-y: hidden;
}
.katex-display { margin: 0 !important; text-align: center; }
.katex-display > .katex { font-size: 1.05em; }
.katex { font-size: 1em; color: #1e1e1e; }
.katex-error {
  color: #dc2626;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  background: #fef2f2;
  padding: 2pt 4pt;
  border-radius: 3px;
}

.mermaid {
  text-align: center;
  margin: 14pt 0;
  padding: 10pt;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  page-break-inside: avoid;
}
.mermaid svg {
  max-width: 60%;
  max-height: 180pt;
  height: auto;
  display: block;
  margin: 0 auto;
}

.footnotes { font-size: 9pt; color: #6b7280; margin-top: 12pt; }
.footnote-ref a { color: #2563eb; text-decoration: none; }
.footnote-backref { text-decoration: none; color: #2563eb; }

h2, h3, h4 { page-break-after: avoid; }
pre, table, blockquote, .mermaid, .math-display { page-break-inside: avoid; }
`;

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { markdown, title, pageSize, orientation, margin } = req.body;
    if (!markdown?.trim()) return res.status(400).json({ error: 'No markdown provided' });

    const pdfMargins = MARGINS[margin] || MARGINS.normal;

    let puppeteer, chromium, browser;
    try {
      puppeteer = require('puppeteer-core');
      chromium = require('@sparticuz/chromium');

      const execPath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: chromium.args || ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport || { width: 1280, height: 800 },
        executablePath: execPath,
        headless: chromium.headless ?? true,
      });
    } catch (launchErr) {
      console.error('Puppeteer launch failed on local server:', launchErr);
      return res.status(500).json({ error: 'Chromium launch failed: ' + launchErr.message });
    }

    try {
      const page = await browser.newPage();
      const withMath = renderKaTeX(markdown);
      const html = '<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><style>' + CSS + '</style></head><body><div class="markdown-body">' + withMath + '</div></body></html>';
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });

      const pdf = await page.pdf({
        format: pageSize || 'A4',
        landscape: orientation === 'landscape',
        margin: pdfMargins,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;display:flex;justify-content:space-between;border-bottom:0.5px solid #e0e0e0;padding-bottom:4pt;"><span>' + (title || 'Document').replace(/</g, '&lt;') + '</span><span>' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + '</span></div>',
        footerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;display:flex;justify-content:space-between;border-top:0.5px solid #e0e0e0;padding-top:4pt;"><span>md2pdf v1.0.2</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span><span>by Gyaanendra</span></div>'
      });

      await browser.close();

      const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '.pdf"');
      res.send(Buffer.from(pdf));
    } catch (renderErr) {
      if (browser) await browser.close().catch(() => {});
      console.error('Render error:', renderErr);
      res.status(500).json({ error: renderErr.message || 'PDF render failed' });
    }

  } catch (err) {
    console.error('PDF error:', err.message || err);
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log('\n  md2pdf → http://localhost:' + PORT + '\n'));
