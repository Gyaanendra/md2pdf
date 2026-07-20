const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const lineNumbers = document.getElementById('line-numbers');
const lineCount = document.getElementById('line-count');
const wordCount = document.getElementById('word-count');
const cursorPos = document.getElementById('cursor-pos');
const btnDownload = document.getElementById('btn-download');
const btnSample = document.getElementById('btn-sample');
const btnClear = document.getElementById('btn-clear');
const modalOverlay = document.getElementById('modal-overlay');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const pdfTitleInput = document.getElementById('pdf-title');
const gutter = document.getElementById('gutter');
const previewScroll = document.getElementById('preview-scroll');

let debounceTimer = null;

// ─── Line numbers ───
function updateLineNumbers() {
  const lines = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += `<span>${i}</span>`;
  lineNumbers.innerHTML = html;
}

// ─── Sync scroll (editor ↔ line numbers) ───
editor.addEventListener('scroll', () => {
  lineNumbers.scrollTop = editor.scrollTop;
});

// ─── Cursor position ───
function updateCursorPos() {
  const val = editor.value;
  const pos = editor.selectionStart;
  const before = val.substring(0, pos);
  const ln = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  cursorPos.textContent = `Ln ${ln}, Col ${col}`;
}
editor.addEventListener('input', updateCursorPos);
editor.addEventListener('click', updateCursorPos);
editor.addEventListener('keyup', updateCursorPos);

// ─── Word count ───
function updateWordCount() {
  const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// ─── Markdown rendering ───
function updatePreview() {
  const md = editor.value;
  updateLineNumbers();
  updateWordCount();
  updateCursorPos();

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

  // ── Step 1: Extract math blocks before marked touches them ──
  const mathBlocks = [];
  let processed = md;

  // Extract display math $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    const id = mathBlocks.length;
    mathBlocks.push({ type: 'display', content });
    return `%%MATH_DISPLAY_${id}%%`;
  });

  // Extract inline math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, content) => {
    const id = mathBlocks.length;
    mathBlocks.push({ type: 'inline', content });
    return `%%MATH_INLINE_${id}%%`;
  });

  // Extract block math \[...\]
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
    const id = mathBlocks.length;
    mathBlocks.push({ type: 'display', content });
    return `%%MATH_DISPLAY_${id}%%`;
  });

  // Extract inline math \(...\)
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => {
    const id = mathBlocks.length;
    mathBlocks.push({ type: 'inline', content });
    return `%%MATH_INLINE_${id}%%`;
  });

  // ── Step 2: Let marked parse the rest ──
  marked.setOptions({ gfm: true, breaks: true });
  let html = marked.parse(processed);

  // ── Step 3: Restore math blocks as rendered KaTeX ──
  mathBlocks.forEach((block, id) => {
    try {
      const rendered = katex.renderToString(block.content, {
        displayMode: block.type === 'display',
        throwOnError: false,
        trust: true
      });
      if (block.type === 'display') {
        html = html.replace(`%%MATH_DISPLAY_${id}%%`, `<div class="katex-display">${rendered}</div>`);
      } else {
        html = html.replace(`%%MATH_INLINE_${id}%%`, rendered);
      }
    } catch (e) {
      const errHtml = `<span class="katex-error">${block.content}</span>`;
      html = html.replace(`%%MATH_${block.type.toUpperCase()}_${id}%%`, errHtml);
    }
  });

  // Clean any remaining placeholders
  html = html.replace(/%%MATH_(?:DISPLAY|INLINE)_\d+%%/g, '');

  preview.innerHTML = html;

  // ── Step 4: Highlight code with Prism ──
  if (typeof Prism !== 'undefined') {
    preview.querySelectorAll('pre code').forEach(block => {
      Prism.highlightElement(block);
    });
  }

  // ── Step 5: Render Mermaid ──
  renderMermaid();
}

// ─── Mermaid render ───
async function renderMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  const blocks = preview.querySelectorAll('code.language-mermaid');
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const pre = block.parentElement;
    const container = document.createElement('div');
    container.className = 'mermaid';
    container.id = `mermaid-${i}`;
    pre.replaceWith(container);
    try {
      const { svg } = await mermaid.render(`mermaid-svg-${i}`, block.textContent);
      container.innerHTML = svg;
    } catch {
      container.textContent = block.textContent;
    }
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
  }, 80);
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
  editor.value = `# AI Research & Engineering Report

> A technical document showcasing markdown-to-PDF conversion with math, code, diagrams, and structured data.

---

## 1. Introduction

This report demonstrates the capabilities of **md2pdf** — a tool that converts Markdown into beautifully formatted PDF documents. It supports **KaTeX math**, **syntax-highlighted code**, **Mermaid diagrams**, tables, blockquotes, and more.

The goal is to produce publication-quality documents from plain text, enabling engineers and researchers to focus on content rather than formatting.

---

## 2. Machine Learning Fundamentals

### 2.1 The Loss Function

Training a neural network minimizes a loss function $\\mathcal{L}(\\theta)$ over parameters $\\theta$. For binary classification with cross-entropy:

$$
\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]
$$

Where $y_i$ is the true label and $\\hat{y}_i$ is the predicted probability.

### 2.2 Gradient Descent Update

Parameters are updated using the gradient:

$$
\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)
$$

Where $\\eta$ is the learning rate.

### 2.3 Attention Mechanism

The transformer attention score is computed as:

$$
\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V
$$

Where $Q$, $K$, $V$ are query, key, and value matrices, and $d_k$ is the key dimension.

---

## 3. System Architecture

\`\`\`mermaid
graph TD
    A[User Input] --> B[Markdown Parser]
    B --> C{Contains Math?}
    C -->|Yes| D[KaTeX Renderer]
    C -->|No| E[HTML Generator]
    D --> E
    E --> F{Contains Code?}
    F -->|Yes| G[Prism Syntax Highlighter]
    F -->|No| H[PDF Renderer]
    G --> H
    H --> I[Final PDF]
\`\`\`

---

## 4. Implementation

### 4.1 Python — Transformer Block

\`\`\`python
import torch
import torch.nn as nn
import math

class TransformerBlock(nn.Module):
    def __init__(self, embed_size, heads, dropout=0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(embed_size, heads)
        self.norm1 = nn.LayerNorm(embed_size)
        self.norm2 = nn.LayerNorm(embed_size)
        self.feed_forward = nn.Sequential(
            nn.Linear(embed_size, embed_size * 4),
            nn.GELU(),
            nn.Linear(embed_size * 4, embed_size),
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Self-attention with residual connection
        attn_out, _ = self.attention(x, x, x, attn_mask=mask)
        x = self.norm1(x + self.dropout(attn_out))
        # Feed-forward with residual connection
        ff_out = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_out))
        return x

# Example usage
model = TransformerBlock(embed_size=512, heads=8)
x = torch.randn(10, 32, 512)  # (seq_len, batch, embed)
output = model(x)
print(f"Output shape: {output.shape}")
\`\`\`

### 4.2 JavaScript — API Handler

\`\`\`javascript
import express from 'express';
import { rateLimit } from 'express-rate-limit';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Rate limiting for PDF generation
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});

app.post('/api/generate', limiter, async (req, res) => {
  const { markdown, options } = req.body;

  if (!markdown?.trim()) {
    return res.status(400).json({ error: 'No markdown provided' });
  }

  try {
    const pdf = await generatePDF(markdown, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.listen(3000, () => console.log('Server running on :3000'));
\`\`\`

---

## 5. Data Pipeline

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant Q as Queue
    participant W as Worker
    participant S as Storage

    U->>A: POST /api/generate
    A->>Q: Enqueue job
    A-->>U: 202 Accepted
    Q->>W: Process markdown
    W->>W: Render PDF
    W->>S: Store file
    W-->>U: Webhook notification
    U->>S: Download PDF
\`\`\`

---

## 6. Performance Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| Parse Speed | 12ms | Average markdown parse time |
| PDF Gen | 180ms | End-to-end PDF generation |
| File Size | 45KB | Average output PDF size |
| Uptime | 99.97% | Service availability |
| Latency P95 | 320ms | 95th percentile response time |

---

## 7. Neural Network Training Flow

\`\`\`mermaid
flowchart LR
    A[Dataset] --> B[Preprocessing]
    B --> C[Batch Loader]
    C --> D[Forward Pass]
    D --> E[Compute Loss]
    E --> F[Backpropagation]
    F --> G{Converged?}
    G -->|No| D
    G -->|Yes| H[Save Model]
\`\`\`

---

## 8. Mathematical Foundations

The softmax function normalizes logits into probabilities:

$$
\\sigma(z_i) = \\frac{e^{z_i}}{\\sum_{j=1}^{K} e^{z_j}}
$$

Batch normalization stabilizes training:

$$
\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}
$$

$$
y_i = \\gamma \\hat{x}_i + \\beta
$$

The learning rate schedule with warmup:

$$
\\eta_t = \\eta_{\\min} + \\frac{1}{2}(\\eta_{\\max} - \\eta_{\\min})\\left(1 + \\cos\\left(\\frac{t}{T}\\pi\\right)\\right)
$$

---

## 9. Conclusion

md2pdf enables developers to create professional documents directly from Markdown. With support for:

- **KaTeX** — Publication-quality math rendering
- **Mermaid** — Architecture and flow diagrams
- **PrismJS** — Syntax highlighting for 30+ languages
- **GFM** — Tables, task lists, and strikethrough

The tool is open source and available on GitHub.

---

*Made by [Gyaanendra](https://github.com/Gyaanendra) — [github.com/Gyaanendra/md2pdf](https://github.com/Gyaanendra/md2pdf)*
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
updateLineNumbers();
updateCursorPos();
