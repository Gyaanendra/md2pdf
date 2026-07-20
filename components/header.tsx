"use client";

import React from "react";
import {
  FileText,
  Copy,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Github,
  Globe,
  Check
} from "lucide-react";

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
  isCopied
}: HeaderProps) {
  return (
    <header className="no-print h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-sm">
            md2pdf
          </span>
          <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200/80 rounded-md">
            v2.0.0
          </span>
        </div>

        {/* Developer Attribution */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
          <span>
            Made by{" "}
            <a
              href="https://github.com/Gyaanendra"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Gyaanendra
            </a>
          </span>
          <a
            href="https://github.com/Gyaanendra/md2pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://gyanendra.vihar.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Developer Portfolio"
            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Header Controls & Action Tools */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onLoadSample}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title="Load sample Markdown report"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Sample</span>
        </button>

        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title="Clear editor"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          onClick={onCopyHtml}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title="Copy rendered HTML markup"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline text-emerald-600 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Copy HTML</span>
            </>
          )}
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title="Print document natively"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Print</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PDF</span>
        </button>
      </div>
    </header>
  );
}
