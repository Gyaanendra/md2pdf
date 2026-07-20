export const SAMPLE_MARKDOWN = `# Quantum & Neural Systems: Architectural Blueprint v2.0

> **Executive Brief**: An interactive technical report demonstrating **md2pdf v2.0** with advanced KaTeX mathematics, chemical reactions, multi-language code snippets, and Mermaid architecture diagrams.

## 1. Executive Summary

This specification outlines the architecture for **md2pdf v2.0** — an enterprise-grade Markdown to vector PDF rendering engine built on Next.js, React Markdown, KaTeX, and Puppeteer. It delivers sub-15ms live previews and true 300 DPI vector PDF output.

![Neural Network Architecture](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=300&fit=crop)

## 2. Machine Learning & Mathematical Foundations

### 2.1 Binary Cross-Entropy Loss
$$\\mathcal{L}(\\theta) = -\\frac{1}{N} \\sum_{i=1}^{N} \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$

### 2.2 Scaled Dot-Product Attention (Transformer Architecture)
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

### 2.3 Time-Dependent Schrödinger Equation
$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$$

## 3. Chemical Reactions & Molecular Kinetics

### 3.1 Methane Combustion (Exothermic Reaction)
$$\\text{CH}_4 + 2\\text{O}_2 \\longrightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O} \\quad (\\Delta H = -891 \\text{ kJ/mol})$$

### 3.2 Industrial Ammonia Synthesis (Haber-Bosch Process)
$$\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3 \\quad (\\Delta H = -92.4 \\text{ kJ/mol})$$

### 3.3 Ethanol Dehydration Reaction
$$\\text{CH}_3\\text{CH}_2\\text{OH} \\xrightarrow[\\Delta]{\\text{H}_2\\text{SO}_4} \\text{CH}_2=\\text{CH}_2 + \\text{H}_2\\text{O}$$

### 3.4 Photosynthesis Energy Conversion
$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{Light Energy}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

## 4. System Architecture

\`\`\`mermaid
graph TD
    A[Markdown Source Input] --> B[React-Markdown AST Parser]
    B --> C{Detect Content Types}
    C -->|LaTeX Formulas| D[KaTeX Math Engine]
    C -->|Mermaid Code| E[Mermaid SVG Renderer]
    C -->|Code Snippets| F[Rehype Highlight Engine]
    D --> G[Unified DOM Preview]
    E --> G
    F --> G
    G --> H[Headless Puppeteer PDF Service]
    H --> I[Vector PDF Document Stream]
\`\`\`

## 5. Implementation Code Snippets

### 5.1 PyTorch Model Training Loop (Python)
\`\`\`python
import torch
import torch.nn as nn

class TransformerBlock(nn.Module):
    def __init__(self, embed_dim: int, heads: int):
        super().__init__()
        self.attn = nn.MultiheadAttention(embed_dim, heads)
        self.norm = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, 4 * embed_dim),
            nn.GELU(),
            nn.Linear(4 * embed_dim, embed_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        attn_out, _ = self.attn(x, x, x)
        x = self.norm(x + attn_out)
        return x + self.mlp(x)
\`\`\`

### 5.2 Next.js Puppeteer PDF Exporter (TypeScript)
\`\`\`typescript
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  const { html, title } = await req.json();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  
  return new NextResponse(pdf, {
    headers: { "Content-Type": "application/pdf" }
  });
}
\`\`\`

## 6. Real-Time Pipeline Sequence

\`\`\`mermaid
sequenceDiagram
    participant User as 👤 User
    participant Monaco as 📝 Editor
    participant Parser as ⚙️ AST Parser
    participant Engine as 📄 Puppeteer API
    User->>Monaco: Types Markdown Content
    Monaco->>Parser: Triggers Live AST Compile
    Parser-->>Monaco: Renders HTML & SVGs
    User->>Engine: Clicks "Export PDF"
    Engine-->>User: Returns 300 DPI Vector PDF
\`\`\`

## 7. Performance & Feature Matrix

| Feature | md2pdf v1.0 (Legacy) | md2pdf v2.0 (Next.js) | Improvement |
|:--------|:---------------------|:----------------------|:------------|
| Render Latency | 140ms | **12ms** | **11.6x Faster** |
| Math Accuracy | 95% | **100% (KaTeX)** | **Perfect Vector** |
| PDF Fidelity | Raster Canvas (Blurry) | **Puppeteer Vector PDF** | **300 DPI Crisp** |
| Code Highlighting | Basic Mono | **Gruvbox Dark Theme** | **Full Token Color** |
| Diagram Support | Static PNGs | **Live Mermaid SVGs** | **Vector Scalable** |

## 8. Footnotes & References

[^1]: Research specifications published under MIT License by Gyaanendra.
[^2]: Vector PDF generation utilizes Chromium Native Print API.

*Made with ❤️ by [Gyaanendra](https://github.com/Gyaanendra)*
`;
