var editor = document.getElementById('editor');
var preview = document.getElementById('preview');
var lineNumbers = document.getElementById('line-numbers');
var lineCount = document.getElementById('line-count');
var wordCount = document.getElementById('word-count');
var cursorPos = document.getElementById('cursor-pos');
var btnDownload = document.getElementById('btn-download');
var btnSample = document.getElementById('btn-sample');
var btnClear = document.getElementById('btn-clear');
var modalOverlay = document.getElementById('modal-overlay');
var modalCancel = document.getElementById('modal-cancel');
var modalConfirm = document.getElementById('modal-confirm');
var pdfTitleInput = document.getElementById('pdf-title');
var pdfSizeSelect = document.getElementById('pdf-size');
var pdfOrientationSelect = document.getElementById('pdf-orientation');
var pdfMarginSelect = document.getElementById('pdf-margin');
var pdfTocCheck = document.getElementById('pdf-toc');
var gutter = document.getElementById('gutter');
var previewScroll = document.getElementById('preview-scroll');
var dropZone = document.getElementById('drop-zone');

var debounceTimer = null;
var DEBOUNCE_MS = 120;

// ─── Line numbers ───
function updateLineNumbers() {
  var lines = editor.value.split('\n').length;
  var html = '';
  for (var i = 1; i <= lines; i++) html += '<span>' + i + '</span>';
  lineNumbers.innerHTML = html;
}

editor.addEventListener('scroll', function() {
  lineNumbers.scrollTop = editor.scrollTop;
});

// ─── Cursor position ───
function updateCursorPos() {
  var val = editor.value;
  var pos = editor.selectionStart;
  var before = val.substring(0, pos);
  var ln = before.split('\n').length;
  var col = pos - before.lastIndexOf('\n');
  cursorPos.textContent = 'Ln ' + ln + ', Col ' + col;
}
editor.addEventListener('input', updateCursorPos);
editor.addEventListener('click', updateCursorPos);
editor.addEventListener('keyup', updateCursorPos);

// ─── Word count ───
function updateWordCount() {
  var words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
}

// ─── Footnote processing ───
function processFootnotes(md) {
  var footnotes = {};
  var counter = 0;

  // Extract footnote definitions: [^label]: content
  var processed = md.replace(/^\[\^(\w+)\]:\s*(.+)$/gm, function(match, label, content) {
    footnotes[label] = content;
    return '<!-- footnote_def_' + label + ' -->';
  });

  // Replace footnote references: [^label]
  processed = processed.replace(/\[\^(\w+)\](?!:)/g, function(match, label) {
    if (footnotes[label] !== undefined) {
      counter++;
      return '<sup class="footnote-ref"><a href="#fn-' + label + '" id="fnref-' + label + '">' + counter + '</a></sup>';
    }
    return match;
  });

  // Remove footnote definition comments
  processed = processed.replace(/<!-- footnote_def_\w+ -->/g, '');

  // Build footnotes section
  if (counter > 0) {
    var fnSection = '\n\n---\n\n<div class="footnotes"><hr>\n<ol>';
    Object.keys(footnotes).forEach(function(label, i) {
      fnSection += '<li id="fn-' + label + '">' + footnotes[label] + ' <a href="#fnref-' + label + '" class="footnote-backref">↩</a></li>';
    });
    fnSection += '</ol></div>';
    processed += fnSection;
  }

  return processed;
}

// ─── TOC generation ───
function generateTOC(md) {
  var headings = [];
  var lines = md.split('\n');
  var inCode = false;

  lines.forEach(function(line) {
    if (line.match(/^```/)) { inCode = !inCode; return; }
    if (inCode) return;

    var match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      var level = match[1].length;
      var text = match[2].replace(/[*_`]/g, '');
      var slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ level: level, text: text, slug: slug });
    }
  });

  if (headings.length < 2) return md;

  var toc = '## Table of Contents\n\n';
  headings.forEach(function(h) {
    var indent = '';
    for (var i = 1; i < h.level; i++) indent += '  ';
    toc += indent + '- [' + h.text + '](#' + h.slug + ')\n';
  });
  toc += '\n---\n\n';

  // Insert after first heading or at top
  var insertPoint = md.indexOf('\n---\n');
  if (insertPoint === -1) insertPoint = md.indexOf('\n\n', md.indexOf('#'));
  if (insertPoint === -1) insertPoint = 0;

  return md.substring(0, insertPoint) + '\n\n' + toc + md.substring(insertPoint);
}

// ─── Preview rendering ───
function updatePreview() {
  var md = editor.value;
  updateLineNumbers();
  updateWordCount();
  updateCursorPos();

  if (!md.trim()) {
    preview.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Start typing markdown on the left</span></div>';
    return;
  }

  if (typeof marked === 'undefined') return;

  // Process footnotes
  var withFootnotes = processFootnotes(md);

  // Extract math blocks before marked touches them
  var mathBlocks = [];
  var processed = withFootnotes;

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

  // Restore KaTeX
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

// ─── Mermaid ───
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

// ─── Debounced input ───
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    updatePreview();
    updateLineCount();
  }, DEBOUNCE_MS);
}

editor.addEventListener('input', onInput);

// ─── Tab key ───
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

// ─── Gutter resize ───
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

// ─── Image drag & drop ───
var editorPane = document.querySelector('.editor-pane');

editorPane.addEventListener('dragenter', function(e) {
  e.preventDefault();
  dropZone.classList.remove('hidden');
});

dropZone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dropZone.classList.add('hidden');
});

dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
});

dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropZone.classList.add('hidden');

  var files = e.dataTransfer.files;
  if (!files.length) return;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!file.type.startsWith('image/')) continue;

    // Compress and resize image
    compressImage(file, 1200, 0.8).then(function(dataUrl) {
      var markdownImage = '\n![' + file.name + '](' + dataUrl + ')\n';
      var pos = editor.selectionStart;
      editor.value = editor.value.substring(0, pos) + markdownImage + editor.value.substring(pos);
      editor.selectionStart = editor.selectionEnd = pos + markdownImage.length;
      onInput();
    });
  }
});

function compressImage(file, maxWidth, quality) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var width = img.width;
        var height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Modal ───
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
  var pageSize = pdfSizeSelect.value;
  var orientation = pdfOrientationSelect.value;
  var margin = pdfMarginSelect.value;
  var includeToc = pdfTocCheck.checked;

  modalOverlay.classList.add('hidden');
  btnDownload.classList.add('loading');
  btnDownload.disabled = true;

  var md = editor.value;
  if (includeToc) md = generateTOC(md);

  try {
    var res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown: md,
        title: title,
        pageSize: pageSize,
        orientation: orientation,
        margin: margin
      })
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

// ─── Sample document ───
btnSample.addEventListener('click', function() {
  editor.value = '# AI Research & Engineering Report\n\n> A technical document showcasing markdown-to-PDF with math, code, diagrams, chemistry, and images.\n\n---\n\n## 1. Introduction\n\nThis report demonstrates **md2pdf** — a tool that converts Markdown into formatted PDFs. It supports **KaTeX math**, **chemistry equations**, **syntax-highlighted code**, **Mermaid diagrams**, **footnotes**[^1], images, tables, and more.\n\n![Neural Network](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=350&fit=crop)\n\n---\n\n## 2. Machine Learning\n\n### 2.1 Loss Function\n\n$$\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$\n\n### 2.2 Gradient Update\n\n$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$$\n\n### 2.3 Attention\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$\n\n---\n\n## 3. Chemistry\n\n### 3.1 Chemical Reactions\n\nCombustion of methane:\n\n$$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$$\n\n### 3.2 Equilibrium\n\n$$\\ce{N2 + 3H2 <=> 2NH3}$$\n\n### 3.3 Organic Synthesis\n\n$$\\ce{CH3CH2OH ->[H2SO4][\\Delta] CH2=CH2 + H2O}$$\n\n### 3.4 Acid-Base\n\n$$\\ce{HCl + NaOH -> NaCl + H2O}$$\n\n---\n\n## 4. System Architecture\n\n```mermaid\ngraph TD\n    A[Input] --> B[Parser]\n    B --> C{Math?}\n    C -->|Yes| D[KaTeX]\n    C -->|No| E[HTML]\n    D --> E\n    E --> F[PDF]\n```\n\n---\n\n## 5. Code\n\n```python\ndef train(model, data, epochs=100):\n    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)\n    for epoch in range(epochs):\n        loss = compute_loss(model, data)\n        loss.backward()\n        optimizer.step()\n        optimizer.zero_grad()\n    return model\n```\n\n---\n\n## 6. Pipeline\n\n```mermaid\nsequenceDiagram\n    participant U as User\n    participant A as API\n    participant W as Worker\n    U->>A: POST\n    A-->>U: 202\n    A->>W: Process\n    W-->>U: Done\n```\n\n---\n\n## 7. Metrics\n\n| Metric | Value |\n|--------|-------|\n| Speed | 12ms |\n| Size | 45KB |\n| Uptime | 99.97% |\n\n---\n\n## 8. Training Flow\n\n```mermaid\nflowchart LR\n    A[Data] --> B[Process]\n    B --> C[Train]\n    C --> D{Done?}\n    D -->|No| C\n    D -->|Yes| E[Save]\n```\n\n---\n\n## 9. Foundations\n\nSoftmax: $\\sigma(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$\n\nBatch norm: $\\hat{x} = \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\cdot \\gamma + $\n\n![Server](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=350&fit=crop)\n\n---\n\n## Footnotes\n\n[^1]: Footnotes are supported! Add them with [^label] syntax.\n\n---\n\n*Made by [Gyaanendra](https://github.com/Gyaanendra)*\n';
  onInput();
});

btnClear.addEventListener('click', function() {
  editor.value = '';
  onInput();
});

// ─── Init ───
onInput();
updateLineNumbers();
updateCursorPos();
