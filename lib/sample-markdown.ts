export const SAMPLE_MARKDOWN = `# AI Research & Engineering Report

> A technical document showcasing **md2pdf v2.0** with math, code, diagrams, chemistry, and images.

## 1. Executive Summary

This report demonstrates **md2pdf v2.0** — a modern tool built with Next.js, React Markdown, KaTeX, and Mermaid.js that converts Markdown into print-ready PDFs. It supports **KaTeX math formulas**, **chemical equations**, **syntax-highlighted code**, **interactive Mermaid diagrams**, **footnotes**[^1], images, tables, and custom print layouts.

![Neural Network Architecture](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=300&fit=crop)

## 2. Machine Learning Foundations

### 2.1 Binary Cross-Entropy Loss
$$\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$

### 2.2 Gradient Descent Update Rule
$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$$

### 2.3 Scaled Dot-Product Attention
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

## 3. Chemical Reactions & Synthesis

### 3.1 Methane Combustion
$$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$$

### 3.2 Ammonia Synthesis (Haber-Bosch Process)
$$\\ce{N2 + 3H2 <=> 2NH3}$$

### 3.3 Ethanol Dehydration
$$\\ce{CH3CH2OH ->[H2SO4][\\Delta] CH2=CH2 + H2O}$$

### 3.4 Neutralization Reaction
$$\\ce{HCl + NaOH -> NaCl + H2O}$$

## 4. System Architecture

\`\`\`mermaid
graph TD
    A[Markdown Input] --> B[React-Markdown Parser]
    B --> C{Contains Math/Diagrams?}
    C -->|LaTeX Math| D[KaTeX Engine]
    C -->|Mermaid Code| E[Mermaid SVG Renderer]
    C -->|Standard Text| F[HTML Elements]
    D --> G[Print & PDF Export Engine]
    E --> G
    F --> G
    G --> H[High-Precision PDF Document]
\`\`\`

## 5. Model Training Code

\`\`\`python
import torch
import torch.nn as nn

def train_epoch(model, dataloader, optimizer, criterion):
    model.train()
    total_loss = 0.0
    for batch_idx, (inputs, targets) in enumerate(dataloader):
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    return total_loss / len(dataloader)
\`\`\`

## 6. Real-Time Pipeline Sequence

\`\`\`mermaid
sequenceDiagram
    participant User as 👤 User
    participant Editor as 📝 Editor Component
    participant Parser as ⚙️ Markdown Parser
    participant Exporter as 📄 PDF Exporter
    User->>Editor: Type Markdown Content
    Editor->>Parser: Live Render Event
    Parser-->>Editor: HTML + SVG Preview
    User->>Exporter: Click "Export PDF"
    Exporter-->>User: Download Print-Ready PDF
\`\`\`

## 7. Performance Benchmarks

| Metric | md2pdf v1 (Legacy) | md2pdf v2 (Next.js) | Improvement |
|--------|---------------------|----------------------|-------------|
| Render Speed | 120ms | 14ms | **8.5x Faster** |
| PDF Export | Serverless Puppeteer | Puppeteer / Local Chromium | **100% Crisp Vector** |
| Memory Overhead | High Memory (Chromium) | Optimized Stream | **High Efficiency** |
| Math Accuracy | 98% | 100% (KaTeX + mhchem) | **Exact** |

## 8. Data Processing Workflow

\`\`\`mermaid
flowchart LR
    Data[Raw Markdown] --> Clean[Sanitize Content]
    Clean --> Parse[Parse Syntax Tree]
    Parse --> SVG[Generate Mermaid SVGs]
    SVG --> Render[Render DOM Preview]
    Render --> Export[Native Puppeteer PDF]
\`\`\`

## 9. Footnotes & Attribution

[^1]: Footnotes are native markdown extensions rendered with automatic back-links.

*Made with ❤️ by [Gyaanendra](https://github.com/Gyaanendra)*
`;
