"use client";

import React from "react";
import { FileText, Copy, Check, Printer, Download, RotateCcw, Sparkles } from "lucide-react";

interface HeaderProps {
  onLoadSample: () => void;
  onClear: () => void;
  onCopyHtml: () => void;
  onPrint: () => void;
  onOpenExportModal: () => void;
  isCopied: boolean;
}

export default function Header({
  onLoadSample,
  onClear,
  onCopyHtml,
  onPrint,
  onOpenExportModal,
  isCopied,
}: HeaderProps) {
  return (
    <header className="no-print h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-2xs z-30 select-none">
      {/* Brand & Developer Attribution */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">md2pdf</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-600 font-semibold rounded border border-blue-200/60">
            v2.0.0
          </span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-slate-200" />

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Made by</span>
          <a
            href="https://github.com/Gyaanendra"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:underline"
          >
            Gyaanendra
          </a>
        </div>
      </div>

      {/* Toolbar Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onLoadSample}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-all active:scale-95"
          title="Load sample Markdown with math & diagrams"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Sample</span>
        </button>

        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          title="Clear editor"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Clear</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          onClick={onCopyHtml}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-all"
          title="Copy compiled HTML to clipboard"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isCopied ? "Copied" : "Copy HTML"}</span>
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-all"
          title="Print document or save via Browser Print"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Print</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-all active:scale-95"
          title="Export as downloadable PDF file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>
    </header>
  );
}
