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

function updateLineNumbers() {
  const lines = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += '<span>' + i + '</span>';
  lineNumbers.innerHTML = html;
}

editor.addEventListener('scroll', () => {
  lineNumbers.scrollTop = editor.scrollTop;
});

function updateCursorPos() {
  const val = editor.value;
  const pos = editor.selectionStart;
  const before = val.substring(0, pos);
  const ln = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  cursorPos.textContent = 'Ln ' + ln + ', Col ' + col;
}
editor.addEventListener('input', updateCursorPos);
editor.addEventListener('click', updateCursorPos);
editor.addEventListener('keyup', updateCursorPos);

function updateWordCount() {
  const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
}

function updatePreview() {
  const md = editor.value;
  updateLineNumbers();
  updateWordCount();
  updateCursorPos();

  if (!md.trim()) {
    preview.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Start typing markdown on the left</span></div>';
    return;
  }

  if (typeof marked === 'undefined') return;

  const mathBlocks = [];
  let processed = md;

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, function(match, content) {
    var id = mathBlocks.length;
    mathBlocks.push({ type: 'display', content: content });
    return '%%MATH_DISPLAY_' + id + '%%';
  });

  processed = processed.replace(/\$([^\$\n]+?)\$/g, function(match, content) {
    var id = mathBlocks.length;
    mathBlocks.push({ type: 'inline', content: content });
    return '%%MATH_INLINE_' + id + '%%';
  });

  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, function(match, content) {
    var id = mathBlocks.length;
    mathBlocks.push({ type: 'display', content: content });
    return '%%MATH_DISPLAY_' + id + '%%';
  });

  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, function(match, content) {
    var id = mathBlocks.length;
    mathBlocks.push({ type: 'inline', content: content });
    return '%%MATH_INLINE_' + id + '%%';
  });

  marked.setOptions({ gfm: true, breaks: true });
  var html = marked.parse(processed);

  mathBlocks.forEach(function(block, id) {
    try {
      var rendered = katex.renderToString(block.content, {
        displayMode: block.type === 'display',
        throwOnError: false,
        trust: true
      });
      if (block.type === 'display') {
        html = html.replace('%%MATH_DISPLAY_' + id + '%%', '<div class="math-display">' + rendered + '</div>');
      } else {
        html = html.replace('%%MATH_INLINE_' + id + '%%', rendered);
      }
    } catch (e) {
      html = html.replace('%%MATH_' + block.type.toUpperCase() + '_' + id + '%%', '<span class="katex-error">' + block.content + '</span>');
    }
  });

  html = html.replace(/%%MATH_(?:DISPLAY|INLINE)_\d+%%/g, '');

  preview.innerHTML = html;

  if (typeof Prism !== 'undefined') {
    preview.querySelectorAll('pre code').forEach(function(block) {
      Prism.highlightElement(block);
    });
  }

  renderMermaid();
}

async function renderMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  var blocks = preview.querySelectorAll('code.language-mermaid');
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var pre = block.parentElement;
    var container = document.createElement('div');
    container.className = 'mermaid';
    container.id = 'mermaid-' + i;
    pre.replaceWith(container);
    try {
      var result = await mermaid.render('mermaid-svg-' + i, block.textContent);
      container.innerHTML = result.svg;
    } catch (e) {
      container.textContent = block.textContent;
    }
  }
}

function updateLineCount() {
  var lines = editor.value.split('\n').length;
  lineCount.textContent = lines + ' line' + (lines !== 1 ? 's' : '');
}

function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    updatePreview();
    updateLineCount();
  }, 80);
}

editor.addEventListener('input', onInput);

editor.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    onInput();
  }
});

var isDragging = false;
gutter.addEventListener('mousedown', function() {
  isDragging = true;
  gutter.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', function(e) {
  if (!isDragging) return;
  var rect = document.querySelector('.container').getBoundingClientRect();
  var pct = ((e.clientX - rect.left) / rect.width) * 100;
  var clamped = Math.max(20, Math.min(80, pct));
  document.querySelector('.editor-pane').style.flex = '0 0 ' + clamped + '%';
  document.querySelector('.preview-pane').style.flex = '0 0 ' + (100 - clamped) + '%';
});
document.addEventListener('mouseup', function() {
  if (isDragging) {
    isDragging = false;
    gutter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

btnDownload.addEventListener('click', function() {
  if (!editor.value.trim()) return;
  modalOverlay.classList.remove('hidden');
  pdfTitleInput.value = '';
  pdfTitleInput.focus();
});
modalCancel.addEventListener('click', function() { modalOverlay.classList.add('hidden'); });
modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });
pdfTitleInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') modalConfirm.click(); });

modalConfirm.addEventListener('click', async function() {
  var title = pdfTitleInput.value.trim() || 'Document';
  modalOverlay.classList.add('hidden');
  btnDownload.classList.add('loading');
  btnDownload.disabled = true;

  try {
    var res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: editor.value, title: title })
    });
    if (!res.ok) {
      var err = await res.json();
      alert('Error: ' + (err.error || 'PDF generation failed'));
      return;
    }
    var blob = await res.blob();
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (title.replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_') || 'document') + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Network error: ' + err.message);
  } finally {
    btnDownload.classList.remove('loading');
    btnDownload.disabled = false;
  }
});

btnSample.addEventListener('click', function() {
  editor.value = '# AI Research & Engineering Report\n\n> A technical document showcasing markdown-to-PDF conversion with math, code, diagrams, and images.\n\n---\n\n## 1. Introduction\n\nThis report demonstrates the capabilities of **md2pdf** — a tool that converts Markdown into beautifully formatted PDF documents. It supports **KaTeX math**, **syntax-highlighted code**, **Mermaid diagrams**, images, tables, and blockquotes.\n\n![Neural Network](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=350&fit=crop)\n\nThe goal is to produce publication-quality documents from plain text, enabling engineers and researchers to focus on content rather than formatting.\n\n---\n\n## 2. Machine Learning Fundamentals\n\n### 2.1 The Loss Function\n\nTraining a neural network minimizes a loss function $\\mathcal{L}(\\theta)$ over parameters $\\theta$. For binary classification with cross-entropy:\n\n$$\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$\n\nWhere $y_i$ is the true label and $\\hat{y}_i$ is the predicted probability.\n\n### 2.2 Gradient Descent Update\n\n$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$$\n\nWhere $\\eta$ is the learning rate.\n\n### 2.3 Attention Mechanism\n\nThe transformer attention score:\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$\n\n![Code on Screen](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=350&fit=crop)\n\n---\n\n## 3. System Architecture\n\n```mermaid\ngraph TD\n    A[User Input] --> B[Markdown Parser]\n    B --> C{Contains Math?}\n    C -->|Yes| D[KaTeX Renderer]\n    C -->|No| E[HTML Generator]\n    D --> E\n    E --> F{Contains Code?}\n    F -->|Yes| G[Prism Highlighter]\n    F -->|No| H[PDF Renderer]\n    G --> H\n    H --> I[Final PDF]\n```\n\n---\n\n## 4. Implementation\n\n### 4.1 Python — Transformer Block\n\n```python\nimport torch\nimport torch.nn as nn\n\nclass TransformerBlock(nn.Module):\n    def __init__(self, embed_size, heads, dropout=0.1):\n        super().__init__()\n        self.attention = nn.MultiheadAttention(embed_size, heads)\n        self.norm1 = nn.LayerNorm(embed_size)\n        self.norm2 = nn.LayerNorm(embed_size)\n        self.feed_forward = nn.Sequential(\n            nn.Linear(embed_size, embed_size * 4),\n            nn.GELU(),\n            nn.Linear(embed_size * 4, embed_size),\n        )\n        self.dropout = nn.Dropout(dropout)\n\n    def forward(self, x, mask=None):\n        attn_out, _ = self.attention(x, x, x, attn_mask=mask)\n        x = self.norm1(x + self.dropout(attn_out))\n        ff_out = self.feed_forward(x)\n        x = self.norm2(x + self.dropout(ff_out))\n        return x\n```\n\n### 4.2 JavaScript — API Handler\n\n```javascript\nimport express from \'express\';\n\nconst app = express();\napp.use(express.json({ limit: \'10mb\' }));\n\napp.post(\'/api/generate\', async (req, res) => {\n  const { markdown } = req.body;\n  if (!markdown?.trim()) {\n    return res.status(400).json({ error: \'No markdown\' });\n  }\n  const pdf = await generatePDF(markdown);\n  res.setHeader(\'Content-Type\', \'application/pdf\');\n  res.send(pdf);\n});\n```\n\n---\n\n## 5. Data Pipeline\n\n```mermaid\nsequenceDiagram\n    participant U as User\n    participant A as API\n    participant W as Worker\n    participant S as Storage\n\n    U->>A: POST /api/generate\n    A-->>U: 202 Accepted\n    A->>W: Process markdown\n    W->>W: Render PDF\n    W->>S: Store file\n    W-->>U: Download ready\n```\n\n---\n\n## 6. Performance Metrics\n\n| Metric | Value | Description |\n|--------|-------|-------------|\n| Parse Speed | 12ms | Markdown parse time |\n| PDF Gen | 180ms | End-to-end generation |\n| File Size | 45KB | Average output size |\n| Uptime | 99.97% | Service availability |\n| Latency P95 | 320ms | 95th percentile |\n\n---\n\n## 7. Training Flow\n\n```mermaid\nflowchart LR\n    A[Dataset] --> B[Preprocessing]\n    B --> C[Forward Pass]\n    C --> D[Compute Loss]\n    D --> E[Backpropagation]\n    E --> F{Converged?}\n    F -->|No| C\n    F -->|Yes| G[Save Model]\n```\n\n---\n\n## 8. Mathematical Foundations\n\nSoftmax function:\n\n$$\\sigma(z_i) = \\frac{e^{z_i}}{\\sum_{j=1}^{K} e^{z_j}}$$\n\nBatch normalization:\n\n$$\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}} \\cdot \\gamma + \\beta$$\n\nLearning rate schedule:\n\n$$\\eta_t = \\eta_{\\min} + \\frac{1}{2}(\\eta_{\\max} - \\eta_{\\min})\\left(1 + \\cos\\left(\\frac{t}{T}\\pi\\right)\\right)$$\n\n![Server Room](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=350&fit=crop)\n\n---\n\n## 9. Conclusion\n\nmd2pdf enables developers to create professional documents from Markdown with:\n\n- **KaTeX** — Math rendering\n- **Mermaid** — Diagrams\n- **PrismJS** — Syntax highlighting\n- **Images** — Full support\n\n---\n\n*Made by [Gyaanendra](https://github.com/Gyaanendra) — [github.com/Gyaanendra/md2pdf](https://github.com/Gyaanendra/md2pdf)*\n';
  onInput();
});

btnClear.addEventListener('click', function() {
  editor.value = '';
  onInput();
});

onInput();
updateLineNumbers();
updateCursorPos();
