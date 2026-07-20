const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const lineCount = document.getElementById('line-count');
const btnDownload = document.getElementById('btn-download');
const btnSample = document.getElementById('btn-sample');
const btnClear = document.getElementById('btn-clear');
const modalOverlay = document.getElementById('modal-overlay');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const pdfTitleInput = document.getElementById('pdf-title');
const gutter = document.getElementById('gutter');

let debounceTimer = null;

// ─── Markdown rendering with marked ───
function updatePreview() {
  const md = editor.value;
  if (!md.trim()) {
    preview.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span>Start typing markdown on the left</span>
      </div>`;
    return;
  }

  if (typeof marked === 'undefined') return;

  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: null // we'll use Prism after render
  });

  let html = marked.parse(md);

  // Inject Prism class attributes so Prism can highlight
  // marked wraps code in <pre><code class="language-xxx"> — Prism autoloader picks that up
  preview.innerHTML = html;

  // Re-highlight all code blocks with Prism
  if (typeof Prism !== 'undefined') {
    preview.querySelectorAll('pre code').forEach(block => {
      Prism.highlightElement(block);
    });
  }

  // Render KaTeX math
  renderMath();
}

// ─── KaTeX auto-render ───
function renderMath() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      trust: true
    });
  }
}

// ─── Line count ───
function updateLineCount() {
  const lines = editor.value.split('\n').length;
  lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
}

// ─── Debounced input ───
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updatePreview();
    updateLineCount();
  }, 100);
}

editor.addEventListener('input', onInput);

// ─── Tab key support ───
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    onInput();
  }
});

// ─── Gutter drag resize ───
let isDragging = false;
gutter.addEventListener('mousedown', () => {
  isDragging = true;
  gutter.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = document.querySelector('.container').getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  const clamped = Math.max(20, Math.min(80, pct));
  document.querySelector('.editor-pane').style.flex = `0 0 ${clamped}%`;
  document.querySelector('.preview-pane').style.flex = `0 0 ${100 - clamped}%`;
});
document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    gutter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

// ─── Modal ───
btnDownload.addEventListener('click', () => {
  if (!editor.value.trim()) return;
  modalOverlay.classList.remove('hidden');
  pdfTitleInput.value = '';
  pdfTitleInput.focus();
});
modalCancel.addEventListener('click', () => modalOverlay.classList.add('hidden'));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });
pdfTitleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') modalConfirm.click(); });

modalConfirm.addEventListener('click', async () => {
  const title = pdfTitleInput.value.trim() || 'Document';
  modalOverlay.classList.add('hidden');
  btnDownload.classList.add('loading');
  btnDownload.disabled = true;

  try {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: editor.value, title })
    });
    if (!res.ok) {
      const err = await res.json();
      alert('Error: ' + (err.error || 'PDF generation failed'));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_') || 'document'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    btnDownload.classList.remove('loading');
    btnDownload.disabled = false;
  }
});

// ─── Sample document ───
btnSample.addEventListener('click', () => {
  editor.value = `# Project Report

A beautifully formatted document with **math**, *code*, and more.

## Features

- Concurrent conversion of multiple files
- Custom stylesheets and scripts
- Front-matter configuration
- Syntax highlighting with PrismJS
- KaTeX math rendering

## Code Examples

\`\`\`javascript
const { mdToPdf } = require('md-to-pdf');

async function convert() {
  const pdf = await mdToPdf({ path: 'readme.md' }, {
    pdf_options: {
      format: 'A4',
      margin: '20mm',
      printBackground: true,
    }
  });
  fs.writeFileSync('output.pdf', pdf.content);
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

Inline code: \`const x = 42;\`

## Math with KaTeX

Inline math: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Block math:

$$
E = mc^2
$$

More complex equations:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{N} n = \\frac{N(N+1)}{2}
$$

Matrix:

$$
A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
$$

## Table

| Feature        | Status | Priority |
|----------------|--------|----------|
| PDF Export     | ✅ Done | High     |
| Live Preview   | ✅ Done | High     |
| KaTeX Math     | ✅ Done | Medium   |
| PrismJS Code   | ✅ Done | Medium   |
| Image Support  | ✅ Done | Medium   |

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

---

## Image

![Sample](https://picsum.photos/600/300)

---

*Generated with Markdown → PDF converter*
`;
  onInput();
});

// ─── Clear ───
btnClear.addEventListener('click', () => {
  editor.value = '';
  onInput();
});

// ─── Init ───
onInput();
