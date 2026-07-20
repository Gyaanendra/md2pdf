"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  onToast: (msg: string, type?: "info" | "success" | "error" | "warning") => void;
}

export default function MarkdownEditor({ value, onChange, onToast }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const lines = value.split("\n");
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorPos = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = value.substring(0, pos);
    const line = textBefore.split("\n").length;
    const col = pos - textBefore.lastIndexOf("\n");
    setCursorPos({ line, col });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (!textareaRef.current) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const compressAndInsertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const mdImage = `\n![${file.name}](${dataUrl})\n`;
          if (textareaRef.current) {
            const pos = textareaRef.current.selectionStart;
            const newValue = value.substring(0, pos) + mdImage + value.substring(pos);
            onChange(newValue);
            onToast("Image inserted into markdown", "success");
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      compressAndInsertImage(files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className="no-print relative h-full flex flex-col bg-white border-r border-slate-200"
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-blue-50/90 backdrop-blur-xs border-2 border-dashed border-blue-500 rounded-xl flex flex-col items-center justify-center text-blue-600 gap-2">
          <Upload className="w-8 h-8 animate-bounce" />
          <p className="text-sm font-semibold">Drop image to insert into Markdown</p>
        </div>
      )}

      {/* Code Editor Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers column */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-4 select-none font-mono text-[11px] text-slate-400 bg-slate-50 border-r border-slate-100 text-right pr-2.5 overflow-hidden leading-relaxed"
        >
          {lines.map((_, i) => (
            <div key={i} className="h-5 flex items-center justify-end">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onClick={updateCursorPos}
          onKeyUp={updateCursorPos}
          onKeyDown={handleKeyDown}
          placeholder="# Type or paste Markdown content here..."
          className="flex-1 p-4 bg-white resize-none font-mono text-xs text-slate-900 focus:outline-none leading-relaxed overflow-y-auto"
          spellCheck={false}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="h-7 px-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
          <span>•</span>
          <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
        </div>
      </div>
    </div>
  );
}
