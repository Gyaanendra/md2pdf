module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { markdown, title, pageSize, orientation, margin } = req.body;
    if (!markdown?.trim()) return res.status(400).json({ error: 'No markdown provided' });

    // Lazy load dependencies
    const katex = require('katex');
    try { require('katex/contrib/mhchem/mhchem.js'); } catch(e) {}

    const MARGINS = {
      normal: { top: '22mm', right: '18mm', bottom: '22mm', left: '18mm' },
      narrow: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      wide: { top: '25mm', right: '30mm', bottom: '25mm', left: '30mm' }
    };

    // Render KaTeX math
    function renderMath(md) {
      let r = md;
      r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, t) => '<div class="math-display">' + katex.renderToString(t.trim(), { displayMode: true, throwOnError: false }) + '</div>');
      r = r.replace(/\$([^\$\n]+?)\$/g, (_, t) => katex.renderToString(t.trim(), { displayMode: false, throwOnError: false }));
      return r;
    }

    // Simple markdown to HTML
    function mdToHTML(md) {
      let h = renderMath(md);
      h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
      h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
      h = h.replace(/^---$/gm, '<hr>');
      h = h.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
      h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
      h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      h = h.replace(/^\- (.+)$/gm, '<li>$1</li>');
      h = h.replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid">$1</div>');
      h = h.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
      h = h.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (m, hdr, body) => {
        const ths = hdr.split('|').filter(x=>x.trim()).map(x=>'<th>'+x.trim()+'</th>').join('');
        const rows = body.trim().split('\n').map(r=>'<tr>'+r.split('|').filter(x=>x.trim()).map(x=>'<td>'+x.trim()+'</td>').join('')+'</tr>').join('');
        return '<table><thead><tr>'+ths+'</tr></thead><tbody>'+rows+'</tbody></table>';
      });
      return '<div class="markdown-body">' + h.replace(/\n/g, '<br>') + '</div>';
    }

    const css = `body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-size:11pt;line-height:1.65;color:#1e1e1e}
.markdown-body{box-sizing:border-box;max-width:100%;margin:0;padding:0}
h1,h2,h3,h4{font-weight:700;color:#111;line-height:1.3;margin:0}
h1{font-size:22pt;border-bottom:2px solid #e0e0e0;text-align:center;padding-bottom:8pt;margin-bottom:8pt}
h2{font-size:16pt;border-bottom:1px solid #eee;padding-bottom:4pt;margin:22pt 0 8pt}
h3{font-size:13pt;margin:16pt 0 6pt}
p{margin:0 0 8pt;text-align:justify}
a{color:#2563eb}
ul,ol{margin:4pt 0 8pt;padding-left:20pt}
li{margin-bottom:3pt}
blockquote{margin:10pt 0;padding:8pt 14pt;border-left:3px solid #ddd;background:#fafafa;color:#555}
hr{border:none;border-top:1px solid #e0e0e0;margin:14pt 0}
code{font-family:monospace;font-size:9pt;background:#f3f4f6;padding:1px 4px;border-radius:3px;color:#e11d48}
pre{margin:10pt 0;padding:10pt 12pt;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;overflow-x:auto}
pre code{font-size:8.5pt;color:#374151;background:transparent;padding:0}
table{border-collapse:collapse;width:100%;margin:10pt 0;font-size:10pt}
th{background:#f9fafb;font-weight:600;border-top:1.5px solid #d1d5db;border-bottom:1.5px solid #d1d5db;padding:6pt 10pt;text-align:left}
td{border-bottom:1px solid #e5e7eb;padding:5pt 10pt}
img{display:block;max-width:70%;height:auto;margin:12pt auto;border-radius:4px}
.math-display{margin:12pt 0;text-align:center}
.katex-display{margin:0!important;text-align:center}
.katex{font-size:1em;color:#1e1e1e}
.mermaid{text-align:center;margin:14pt 0;padding:10pt;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px}
.mermaid svg{max-width:60%;max-height:180pt;height:auto;display:block;margin:0 auto}`;

    const html = mdToHTML(markdown);

    // Launch puppeteer-core
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent('<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><style>' + css + '</style></head><body>' + html + '</body></html>', { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format: pageSize || 'A4',
      landscape: orientation === 'landscape',
      margin: MARGINS[margin] || MARGINS.normal,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;display:flex;justify-content:space-between;border-bottom:0.5px solid #e0e0e0"><span>' + (title || 'Document').replace(/</g, '&lt;') + '</span><span>' + new Date().toLocaleDateString() + '</span></div>',
      footerTemplate: '<div style="width:100%;padding:0 18mm;font-size:8px;color:#999;font-family:Inter,sans-serif;text-align:center;border-top:0.5px solid #e0e0e0">md2pdf v1.00.01 | Page <span class="pageNumber"></span> of <span class="totalPages"></span> | by Gyaanendra</div>'
    });

    await browser.close();

    const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + safeName + '.pdf"');
    res.send(Buffer.from(pdf));

  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
};
