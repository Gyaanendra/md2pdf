var editor = document.getElementById('editor');
var preview = document.getElementById('preview');
var lineNumbers = document.getElementById('line-numbers');
var lineCount = document.getElementById('line-count');
var wordCount = document.getElementById('word-count');
var cursorPos = document.getElementById('cursor-pos');
var btnDownload = document.getElementById('btn-download');
var btnSample = document.getElementById('btn-sample');
var btnClear = document.getElementById('btn-clear');
var btnCopyHtml = document.getElementById('btn-copy-html');
var btnPrint = document.getElementById('btn-print');
var modalOverlay = document.getElementById('modal-overlay');
var modalCancel = document.getElementById('modal-cancel');
var modalConfirm = document.getElementById('modal-confirm');
var modalCloseIcon = document.getElementById('modal-close-icon');
var pdfTitleInput = document.getElementById('pdf-title');
var pdfSizeSelect = document.getElementById('pdf-size');
var pdfOrientationSelect = document.getElementById('pdf-orientation');
var pdfMarginSelect = document.getElementById('pdf-margin');
var pdfTocCheck = document.getElementById('pdf-toc');
var gutter = document.getElementById('gutter');
var dropZone = document.getElementById('drop-zone');
var toastContainer = document.getElementById('toast-container');

var debounceTimer = null;
var DEBOUNCE_MS = 120;

// ─── Toast System ───
function showToast(message, type, duration) {
  if (!toastContainer) return;
  type = type || 'info';
  duration = duration || 3500;

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  var iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = iconSvg + '<span>' + message + '</span>';
  toastContainer.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('toast-out');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, duration);
}

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

  var processed = md.replace(/^\[\^(\w+)\]:\s*(.+)$/gm, function(match, label, content) {
    footnotes[label] = content;
    return '<!-- footnote_def_' + label + ' -->';
  });

  processed = processed.replace(/\[\^(\w+)\](?!:)/g, function(match, label) {
    if (footnotes[label] !== undefined) {
      counter++;
      return '<sup class="footnote-ref"><a href="#fn-' + label + '" id="fnref-' + label + '">' + counter + '</a></sup>';
    }
    return match;
  });

  processed = processed.replace(/<!-- footnote_def_\w+ -->/g, '');

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

  var withFootnotes = processFootnotes(md);

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

    compressImage(file, 1200, 0.8).then(function(dataUrl) {
      var markdownImage = '\n![' + file.name + '](' + dataUrl + ')\n';
      var pos = editor.selectionStart;
      editor.value = editor.value.substring(0, pos) + markdownImage + editor.value.substring(pos);
      editor.selectionStart = editor.selectionEnd = pos + markdownImage.length;
      onInput();
      showToast('Image inserted into document', 'success');
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

// ─── Toolbar Action Listeners ───
if (btnCopyHtml) {
  btnCopyHtml.addEventListener('click', function() {
    if (!preview.innerHTML.trim()) return;
    navigator.clipboard.writeText(preview.innerHTML).then(function() {
      showToast('HTML copied to clipboard!', 'success');
    }).catch(function() {
      showToast('Failed to copy HTML', 'error');
    });
  });
}

if (btnPrint) {
  btnPrint.addEventListener('click', function() {
    window.print();
  });
}

// ─── Modal Listeners ───
btnDownload.addEventListener('click', function() {
  if (!editor.value.trim()) {
    showToast('Please type or paste markdown content first', 'warning');
    return;
  }
  modalOverlay.classList.remove('hidden');
  pdfTitleInput.value = '';
  pdfTitleInput.focus();
});

if (modalCloseIcon) {
  modalCloseIcon.addEventListener('click', function() { modalOverlay.classList.add('hidden'); });
}

modalCancel.addEventListener('click', function() { modalOverlay.classList.add('hidden'); });
modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });
pdfTitleInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') modalConfirm.click(); });

// ─── Client-Side PDF Generation Engine ───
async function generatePdfClientSide(opts) {
  var title = opts.title || 'Document';
  var pageSize = opts.pageSize || 'A4';
  var orientation = opts.orientation || 'portrait';
  var margin = opts.margin || 'normal';

  var marginsMap = {
    normal: [15, 15, 15, 15],
    narrow: [8, 8, 8, 8],
    wide: [20, 25, 20, 25]
  };
  var pdfMargins = marginsMap[margin] || marginsMap.normal;

  var container = document.createElement('div');
  container.className = 'markdown-body pdf-export-container';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.width = '100%';
  container.style.background = '#ffffff';

  var header = document.createElement('div');
  header.className = 'pdf-export-header';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.borderBottom = '1px solid #e5e7eb';
  header.style.paddingBottom = '8px';
  header.style.marginBottom = '20px';
  header.style.fontSize = '9pt';
  header.style.color = '#6b7280';
  header.innerHTML = '<span>' + title.replace(/</g, '&lt;') + '</span><span>' + new Date().toLocaleDateString() + '</span>';
  container.appendChild(header);

  var content = preview.cloneNode(true);
  
  var svgList = content.querySelectorAll('.mermaid svg');
  svgList.forEach(function(svg) {
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
  });

  container.appendChild(content);

  var filename = (title.replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_') || 'document') + '.pdf';

  if (typeof html2pdf !== 'undefined') {
    var html2pdfOptions = {
      margin: pdfMargins,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: pageSize.toLowerCase(), orientation: orientation },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    try {
      showToast('Rendering high-precision PDF...', 'info', 2000);
      await html2pdf().set(html2pdfOptions).from(container).save();
      showToast('PDF downloaded successfully!', 'success');
      return;
    } catch (e) {
      console.warn('html2pdf export error, falling back to window.print:', e);
    }
  }

  var printWin = window.open('', '_blank');
  printWin.document.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
  printWin.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">');
  printWin.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">');
  printWin.document.write('<link rel="stylesheet" href="style.css">');
  printWin.document.write('<style>body{padding:20px;background:#fff;} .pdf-export-container{max-width:100%!important;}</style>');
  printWin.document.write('</head><body>');
  printWin.document.write(container.outerHTML);
  printWin.document.write('</body></html>');
  printWin.document.close();
  printWin.focus();
  setTimeout(function() {
    printWin.print();
    printWin.close();
  }, 500);
}

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

  var useClientFallback = false;

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

    if (res.ok) {
      var contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        var blob = await res.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (title.replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_') || 'document') + '.pdf';
        a.click();
        URL.revokeObjectURL(url);
        showToast('PDF downloaded successfully!', 'success');
        btnDownload.classList.remove('loading');
        btnDownload.disabled = false;
        return;
      }
    }

    console.warn('API returned non-PDF response or status ' + res.status + ', using client-side generator...');
    useClientFallback = true;
  } catch (err) {
    console.warn('Serverless endpoint unavailable or network issue, using client-side generator:', err);
    useClientFallback = true;
  }

  if (useClientFallback) {
    try {
      await generatePdfClientSide({
        markdown: md,
        title: title,
        pageSize: pageSize,
        orientation: orientation,
        margin: margin
      });
    } catch (e) {
      showToast('PDF generation failed: ' + e.message, 'error');
    }
  }

  btnDownload.classList.remove('loading');
  btnDownload.disabled = false;
});

// ─── Sample document ───
btnSample.addEventListener('click', function() {
  editor.value = '# AI Research & Engineering Report\n\n> A technical document showcasing markdown-to-PDF with math, code, diagrams, chemistry, and images.\n\n---\n\n## 1. Introduction\n\nThis report demonstrates **md2pdf** — a tool that converts Markdown into formatted PDFs. It supports **KaTeX math**, **chemistry equations**, **syntax-highlighted code**, **Mermaid diagrams**, **footnotes**[^1], images, tables, and more.\n\n![Neural Network](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=350&fit=crop)\n\n---\n\n## 2. Machine Learning\n\n### 2.1 Loss Function\n\n$$\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$\n\n### 2.2 Gradient Update\n\n$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$$\n\n### 2.3 Attention\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$\n\n---\n\n## 3. Chemistry\n\n### 3.1 Chemical Reactions\n\nCombustion of methane:\n\n$$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$$\n\n### 3.2 Equilibrium\n\n$$\\ce{N2 + 3H2 <=> 2NH3}$$\n\n### 3.3 Organic Synthesis\n\n$$\\ce{CH3CH2OH ->[H2SO4][\\Delta] CH2=CH2 + H2O}$$\n\n### 3.4 Acid-Base\n\n$$\\ce{HCl + NaOH -> NaCl + H2O}$$\n\n---\n\n## 4. System Architecture\n\n```mermaid\ngraph TD\n    A[Input] --> B[Parser]\n    B --> C{Math?}\n    C -->|Yes| D[KaTeX]\n    C -->|No| E[HTML]\n    D --> E\n    E --> F[PDF]\n```\n\n---\n\n## 5. Code\n\n```python\ndef train(model, data, epochs=100):\n    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)\n    for epoch in range(epochs):\n        loss = compute_loss(model, data)\n        loss.backward()\n        optimizer.step()\n        optimizer.zero_grad()\n    return model\n```\n\n---\n\n## 6. Pipeline\n\n```mermaid\nsequenceDiagram\n    participant U as User\n    participant A as API\n    participant W as Worker\n    U->>A: POST\n    A-->>U: 202\n    A->>W: Process\n    W-->>U: Done\n```\n\n---\n\n## 7. Metrics\n\n| Metric | Value |\n|--------|-------|\n| Speed | 12ms |\n| Size | 45KB |\n| Uptime | 99.97% |\n\n---\n\n## 8. Training Flow\n\n```mermaid\nflowchart LR\n    A[Data] --> B[Process]\n    B --> C[Train]\n    C --> D{Done?}\n    D -->|No| C\n    D -->|Yes| E[Save]\n```\n\n---\n\n## 9. Foundations\n\nSoftmax: $\\sigma(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$\n\nBatch norm: $\\hat{x} = \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\cdot \\gamma + $\n\n![Server](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=350&fit=crop)\n\n---\n\n## Footnotes\n\n[^1]: Footnotes are supported! Add them with [^label] syntax.\n\n---\n\n*Made by [Gyaanendra](https://github.com/Gyaanendra)*\n';
  onInput();
  showToast('Sample report loaded', 'info');
});

btnClear.addEventListener('click', function() {
  editor.value = '';
  onInput();
  showToast('Editor cleared', 'info');
});

// ─── Init ───
onInput();
updateLineNumbers();
updateCursorPos();
