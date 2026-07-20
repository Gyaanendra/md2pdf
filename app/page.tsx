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
  const [isCopied, setIsCopied] = useState(false);
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

  // Actions
  const handleLoadSample = () => {
    setMarkdown(SAMPLE_MARKDOWN);
    showToast("Loaded sample report", "info");
  };

  const handleClear = () => {
    setMarkdown("");
    showToast("Editor cleared", "info");
  };

  const handleCopyHtml = () => {
    const previewEl = document.getElementById("preview-content");
    if (!previewEl || !previewEl.innerHTML.trim()) return;

    navigator.clipboard.writeText(previewEl.innerHTML).then(() => {
      setIsCopied(true);
      showToast("HTML copied to clipboard!", "success");
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      showToast("Failed to copy HTML", "error");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Direct PDF Download Engine using jsPDF & html2canvas
  const handleExportPdf = async (options: ExportOptions) => {
    showToast("Generating PDF download...", "info");

    const element = document.getElementById("preview-content");
    if (!element) return;

    try {
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");
      const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
      const { jsPDF } = jsPDFModule;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const marginMm = options.margin === "narrow" ? 8 : options.margin === "wide" ? 25 : 15;
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

      const filename = formatFilename(options.title);
      pdf.save(filename);
      showToast("PDF downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Direct PDF export error:", err);
      showToast("PDF generation error: " + (err?.message || "Unknown error"), "error");
    }
  };

  // Gutter drag resizing
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
      {/* Toast Overlay */}
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

      {/* Header */}
      <Header
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onCopyHtml={handleCopyHtml}
        onPrint={handlePrint}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isCopied={isCopied}
      />

      {/* Main Split Pane Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Markdown Editor */}
        <div style={{ width: `${splitRatio}%` }} className="h-full overflow-hidden">
          <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            onToast={showToast}
          />
        </div>

        {/* Resizable Gutter Splitter */}
        <div
          onMouseDown={() => {
            setIsDraggingGutter(true);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          className="no-print w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors z-20 flex items-center justify-center group"
        >
          <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full" />
        </div>

        {/* Right Pane: Live Markdown & PDF Preview */}
        <div style={{ width: `${100 - splitRatio}%` }} className="h-full overflow-y-auto bg-white p-6 md:p-10 print-container">
          <MarkdownPreview content={markdown} />
        </div>
      </main>

      {/* PDF Export Options Modal */}
      <PdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportPdf}
      />
    </div>
  );
}
