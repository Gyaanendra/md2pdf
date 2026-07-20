const katex = require('katex');

// Try to load mhchem
try { require('katex/contrib/mhchem/mhchem.js'); } catch(e) {}

// Only import md-mermaid-pdf for local dev (not Vercel)
let mdToPdfLocal = null;
try {
  if (!process.env.VERCEL) {
    mdToPdfLocal = require('md-mermaid-pdf').mdToPdf;
  }
} catch(e) {}

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

function getCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.65;
  color: #1e1e1e;
}

.markdown-body { box-sizing: border-box; min-width: 0; max-width: 100%; margin: 0; padding: 0; font-family: inherit; font-size: inherit; line-height: inherit; }

h1, h2, h3, h4, h5, h6 { font-family: 'Inter', sans-serif; font-weight: 700; color: #111; line-height: 1.3; margin: 0; page-break-after: avoid; }
h1 { font-size: 22pt; margin-bottom: 8pt; padding-bottom: 8pt; border-bottom: 2px solid #e0e0e0; text-align: center; }
h2 { font-size: 16pt; margin-top: 22pt; margin-bottom: 8pt; padding-bottom: 4pt; border-bottom: 1px solid #eee; }
h3 { font-size: 13pt; margin-top: 16pt; margin-bottom: 6pt; }
h4 { font-size: 11.5pt; margin-top: 12pt; margin-bottom: 4pt; font-weight: 600; }

p { margin: 0 0 8pt 0; text-align: justify; }
a { color: #2563eb; text-decoration: none; }

ul, ol { margin: 4pt 0 8pt 0; padding-left: 20pt; }
li { margin-bottom: 3pt; }
li > p { margin: 0; }

blockquote { margin: 10pt 0; padding: 8pt 14pt; border-left: 3px solid #ddd; background: #fafafa; color: #555; border-radius: 0 4px 4px 0; }
blockquote p { margin: 0; text-align: left; }

hr { border: none; border-top: 1px solid #e0e0e0; margin: 14pt 0; }

code { font-family: 'JetBrains Mono', monospace; font-size: 9pt; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; color: #e11d48; }

pre { margin: 10pt 0; padding: 10pt 12pt; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; overflow-x: auto; page-break-inside: avoid; line-height: 1.5; }
pre code { font-size: 8.5pt; color: #374151; background: transparent; padding: 0; border-radius: 0; }

table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 10pt; page-break-inside: avoid; }
thead th { background: #f9fafb; font-weight: 600; border-top: 1.5px solid #d1d5db; border-bottom: 1.5px solid #d1d5db; padding: 6pt 10pt; text-align: left; }
tbody td { border-bottom: 1px solid #e5e7eb; padding: 5pt 10pt; }
tbody tr:last-child td { border-bottom: 1.5px solid #d1d5db; }

img { display: block; max-width: 70%; height: auto; margin: 12pt auto; border-radius: 4px; }

.math-display { margin: 12pt 0; text-align: center; page-break-inside: avoid; overflow-x: auto; overflow-y: hidden; }
.katex-display { margin: 0 !important; text-align: center; }
.katex-display > .katex { font-size: 1.05em; }
.katex { font-size: 1em; color: #1e1e1e; }

.mermaid { text-align: center; margin: 14pt 0; padding: 10pt; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; page-break-inside: avoid; }
.mermaid svg { max-width: 60%; max-height: 180pt; height: auto; display: block; margin: 0 auto; }

.footnotes { font-size: 9pt; color: #6b7280; margin-top: 12pt; }
.footnote-ref a { color: #2563eb; text-decoration: none; }
.footnote-backref { text-decoration: none; color: #2563eb; }

h2, h3, h4 { page-break-after: avoid; }
pre, table, blockquote, .mermaid, .math-display { page-break-inside: avoid; }
`;
}

function buildHTML(markdown) {
  const md = renderKaTeX(markdown);

  // Simple markdown to HTML (basic conversion for PDF)
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/^\- (.+)$/gm, '<li>$1</li>');

  // Handle mermaid blocks
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid">$1</div>');

  // Handle code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Handle tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
    const ths = header.split('|').filter(h => h.trim()).map(h => '<th>' + h.trim() + '</th>').join('');
    const rows = body.trim().split('\n').map(row => {
      const tds = row.split('|').filter(d => d.trim()).map(d => '<td>' + d.trim() + '</td>').join('');
      return '<tr>' + tds + '</tr>';
    }).join('');
    return '<table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>';
  });

  // Wrap in markdown-body div
  return '<div class="markdown-body">' + html.replace(/\n/g, '<br>') + '</div>';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { markdown, title, pageSize, orientation, margin } = req.body;
    if (!markdown?.trim()) return res.status(400).json({ error: 'No markdown provided' });

    const pdfMargins = MARGINS[margin] || MARGINS.normal;
    const htmlContent = buildHTML(markdown);

    // Use puppeteer-core for Vercel
    let browser;
    try {
      const chromium = require('@sparticuz/chromium');
      const puppeteer = require('puppeteer-core');

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } catch (e) {
      // Fallback to md-mermaid-pdf for local dev
      if (!mdToPdfLocal) throw new Error('No PDF engine available');
      const mdToPdf = mdToPdfLocal;
      const withMath = renderKaTeX(markdown);
      const pdf = await mdToPdf({ content: withMath }, {
        launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
        pdf_options: {
          format: pageSize || 'A4',
          landscape: orientation === 'landscape',
          margin: pdfMargins,
          printBackground: true,
        },
        stylesheet: [],
        css: getCSS(),
      });
      if (!pdf?.content) return res.status(500).json({ error: 'PDF generation failed' });
      const buf = Buffer.from(pdf.content);
      const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '.pdf"');
      return res.send(buf);
    }

    const page = await browser.newPage();
    await page.setContent(`<!DOCTYPE html>
<html><head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>${getCSS()}</style>
</head><body>${htmlContent}</body></html>`, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: pageSize || 'A4',
      landscape: orientation === 'landscape',
      margin: pdfMargins,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;display:flex;justify-content:space-between;border-bottom:0.5px solid #e0e0e0;padding-bottom:4pt;"><span>' + (title || 'Document').replace(/</g, '&lt;') + '</span><span>' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + '</span></div>',
      footerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;display:flex;justify-content:space-between;border-top:0.5px solid #e0e0e0;padding-top:4pt;"><span>md2pdf v1.00.01</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span><span>by Gyaanendra</span></div>'
    });

    await browser.close();

    const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '.pdf"');
    res.send(Buffer.from(pdfBuffer));

  } catch (err) {
    console.error('PDF error:', err.message || err);
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
};
