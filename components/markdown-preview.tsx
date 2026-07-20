"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import MermaidRenderer from "./mermaid-renderer";

import "katex/dist/katex.min.css";
import "katex/dist/contrib/mhchem";

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const katex = (window as any).katex;
      if (katex && !katex.__defineMacro) {
        katex.__defineMacro = () => {};
      }
    }
  }, []);

  if (!content.trim()) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 gap-3">
        <svg className="w-12 h-12 stroke-[1.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p className="text-sm font-medium">Type markdown on the left pane to preview document</p>
      </div>
    );
  }

  return (
    <div id="preview-content" className="markdown-body prose max-w-none prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-img:rounded-xl prose-img:mx-auto prose-img:shadow-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-mermaid/.exec(className || "");
            const isInline = inline || (!match && !className?.includes("language-"));

            if (match) {
              const chart = String(children).replace(/\n$/, "");
              return <MermaidRenderer chart={chart} />;
            }

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-[13px] font-mono"
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#e11d48",
                    border: "1px solid #e2e8f0"
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const lang = (className || "").replace("language-", "").toUpperCase() || "CODE";

            return (
              <div
                className="my-4 rounded-xl overflow-hidden page-break-inside-avoid shadow-xs"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div
                  className="px-4 py-1.5 flex justify-between items-center text-[11px] font-mono font-semibold"
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderBottom: "1px solid #e2e8f0",
                    color: "#64748b"
                  }}
                >
                  <span>{lang}</span>
                </div>
                <pre
                  className="p-4 overflow-x-auto text-xs font-mono leading-relaxed"
                  style={{
                    backgroundColor: "#f8fafc",
                    color: "#0f172a"
                  }}
                >
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table({ children }) {
            return (
              <div
                className="my-6 overflow-x-auto rounded-xl page-break-inside-avoid shadow-xs"
                style={{ border: "1px solid #e2e8f0" }}
              >
                <table className="w-full text-left text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead
                className="font-semibold"
                style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#334155" }}
              >
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2.5">{children}</th>;
          },
          td({ children }) {
            return (
              <td
                className="px-4 py-2 text-slate-600"
                style={{ borderTop: "1px solid #f1f5f9" }}
              >
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                className="my-4 pl-4 pr-3 py-2 rounded-r-lg italic text-sm"
                style={{
                  borderLeft: "4px solid #2563eb",
                  backgroundColor: "#eff6ff",
                  color: "#1e3a8a"
                }}
              >
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return (
              <h1
                className="text-3xl font-extrabold pb-3 mb-6 text-center tracking-tight"
                style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0" }}
              >
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2
                className="text-xl font-bold pt-6 pb-2 mb-4 tracking-tight"
                style={{ color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}
              >
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3
                className="text-base font-semibold pt-4 mb-3 tracking-tight"
                style={{ color: "#334155" }}
              >
                {children}
              </h3>
            );
          },
          hr() {
            return <hr className="my-8" style={{ borderTop: "1px solid #e2e8f0" }} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
