"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import MarkdownEditor from "@/components/markdown-editor";
import MarkdownPreview from "@/components/markdown-preview";
import PdfExportModal, { ExportOptions } from "@/components/pdf-export-modal";
import { SAMPLE_MARKDOWN } from "@/lib/sample-markdown";
import { formatFilename } from "@/lib/utils";
import { Check, Info, AlertTriangle, XCircle } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export default function Home() {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MARKDOWN);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDraggingGutter, setIsDraggingGutter] = useState(false);

  // Toast Notification System
  const showToast = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Toolbar Actions
  const handleLoadSample = () => {
    setMarkdown(SAMPLE_MARKDOWN);
    showToast("Loaded sample report", "info");
  };

  const handleClear = () => {
    setMarkdown("");
    showToast("Editor cleared", "info");
  };

  // Deep Color Sanitizer for html2canvas compatibility with Tailwind CSS v4 (lab / oklch functions)
  const sanitizeDocumentColors = (doc: Document) => {
    const styleTags = Array.from(doc.querySelectorAll("style"));
    styleTags.forEach((styleTag) => {
      if (styleTag.textContent && (styleTag.textContent.includes("lab(") || styleTag.textContent.includes("oklch("))) {
        styleTag.textContent = styleTag.textContent
          .replace(/lab\([^)]+\)/gi, "rgb(15, 23, 42)")
          .replace(/oklch\([^)]+\)/gi, "rgb(15, 23, 42)")
          .replace(/color\(srgb[^)]+\)/gi, "rgb(15, 23, 42)");
      }
    });

    const allElements = Array.from(doc.querySelectorAll("*"));
    allElements.forEach((el: any) => {
      try {
        if (!el || !el.style) return;
        const win = el.ownerDocument?.defaultView || window;
        const computed = win.getComputedStyle(el);

        const colorProperties = ["color", "backgroundColor", "borderColor", "outlineColor", "fill", "stroke"];
        colorProperties.forEach((prop) => {
          const val = computed[prop as any];
          if (val && (val.includes("lab(") || val.includes("oklch("))) {
            el.style[prop] = "rgb(15, 23, 42)";
          }
        });
      } catch (err) {
        // ignore errors
      }
    });
  };

  // PDF Download Engine (Primary html2pdf.js CDN, Fallback jsPDF+html2canvas)
  const handleExportPdf = async (options: ExportOptions) => {
    showToast("Generating PDF download...", "info");

    const element = document.getElementById("preview-content");
    if (!element) return;

    sanitizeDocumentColors(document);

    const marginMm = options.margin === "narrow" ? 8 : options.margin === "wide" ? 25 : 15;
    const filename = formatFilename(options.title);

    try {
      const html2pdf = (window as any).html2pdf;
      if (typeof html2pdf === "function") {
        const opt = {
          margin: marginMm,
          filename: filename,
          image: { type: "jpeg", quality: 0.98 },
          pagebreak: {
            mode: ["avoid-all", "css", "legacy"],
            avoid: ["tr", "img", "pre", "table", "blockquote", ".mermaid-wrapper", ".katex-display", "h1", "h2", "h3"]
          },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            onclone: (clonedDoc: Document) => {
              sanitizeDocumentColors(clonedDoc);
            }
          },
          jsPDF: { unit: "mm", format: options.pageSize.toLowerCase(), orientation: options.orientation }
        };
        await html2pdf().set(opt).from(element).save();
        showToast("PDF downloaded successfully!", "success");
        return;
      }

      // Fallback Engine: jsPDF + html2canvas
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");
      const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
      const { jsPDF } = jsPDFModule;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
          sanitizeDocumentColors(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const pdf = new jsPDF({
        orientation: options.orientation,
        unit: "mm",
        format: options.pageSize.toLowerCase() as any,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - marginMm * 2;
      const printableHeight = pageHeight - marginMm * 2;

      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = marginMm;

      pdf.addImage(imgData, "JPEG", marginMm, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginMm;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", marginMm, position, imgWidth, imgHeight);
        heightLeft -= printableHeight;
      }

      pdf.save(filename);
      showToast("PDF downloaded successfully!", "success");
    } catch (err: any) {
      console.error("PDF export error:", err);
      showToast("Launching print dialog for high-res PDF...", "warning");
      window.print();
    }
  };

  // Gutter Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingGutter) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(20, Math.min(80, pct));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingGutter) {
        setIsDraggingGutter(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    if (isDraggingGutter) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingGutter]);

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      {/* Toast Notification Container */}
      <div className="no-print fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-white border-slate-200 text-slate-800 shadow-xl"
            }`}
          >
            {toast.type === "success" && <Check className="w-4 h-4 text-emerald-600" />}
            {toast.type === "error" && <XCircle className="w-4 h-4 text-rose-600" />}
            {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-blue-600" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Bar */}
      <Header
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Split Pane Interface */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Line-Numbered Markdown Editor */}
        <div style={{ width: `${splitRatio}%` }} className="h-full overflow-hidden no-print">
          <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            onToast={showToast}
          />
        </div>

        {/* Resizable Gutter */}
        <div
          onMouseDown={() => {
            setIsDraggingGutter(true);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          className="no-print gutter w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors z-20 flex items-center justify-center group"
        >
          <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full" />
        </div>

        {/* Right Pane: Live Document & PDF Preview */}
        <div style={{ width: `${100 - splitRatio}%` }} className="h-full overflow-y-auto bg-white p-6 md:p-10 print-container">
          <MarkdownPreview content={markdown} />
        </div>
      </main>

      {/* PDF Export Configuration Modal */}
      <PdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportPdf}
      />
    </div>
  );
}
