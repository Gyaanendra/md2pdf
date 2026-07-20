"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, Sparkles } from "lucide-react";
import { formatFilename } from "@/lib/utils";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  defaultTitle?: string;
}

export interface ExportOptions {
  title: string;
  pageSize: "A4" | "Letter" | "Legal" | "A3" | "A5";
  orientation: "portrait" | "landscape";
  margin: "normal" | "narrow" | "wide";
  includeToc: boolean;
}

export default function PdfExportModal({ isOpen, onClose, onExport, defaultTitle = "Document" }: PdfExportModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [pageSize, setPageSize] = useState<"A4" | "Letter" | "Legal" | "A3" | "A5">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<"normal" | "narrow" | "wide">("normal");
  const [includeToc, setIncludeToc] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
    }
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onExport({
        title: title.trim() || defaultTitle || "Document",
        pageSize,
        orientation,
        margin,
        includeToc
      });
      onClose();
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Export PDF</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 text-xs">
            {/* Document Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-slate-700 font-medium">
                  Document Title
                </label>
                <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-detected from Markdown
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Document Title"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                autoFocus
              />
            </div>

            {/* Page Size & Orientation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Letter">Letter (8.5 x 11 in)</option>
                  <option value="Legal">Legal (8.5 x 14 in)</option>
                  <option value="A3">A3 (297 x 420 mm)</option>
                  <option value="A5">A5 (148 x 210 mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            {/* Margins & Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Margin
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="normal">Normal (10mm)</option>
                  <option value="narrow">Narrow (5mm)</option>
                  <option value="wide">Wide (18mm)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Generate TOC</span>
                </label>
              </div>
            </div>

            {/* Output filename preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Output File:</span>
              <span className="font-mono text-blue-600 font-medium">{formatFilename(title)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
