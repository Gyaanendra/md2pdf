"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import MermaidRenderer from "./mermaid-renderer";
import katex from "katex";

import "katex/dist/katex.min.css";

if (typeof window !== "undefined") {
  (window as any).katex = katex;
}

try {
  require("katex/dist/contrib/mhchem");
} catch (e) {
  // fallback
}

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const k = (window as any).katex || katex;
      if (k && !k.__defineMacro) {
        k.__defineMacro = () => {};
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
        rehypePlugins={[rehypeHighlight, [rehypeKatex, { trust: true, strict: false }]]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-mermaid/.exec(className || "");
            const isInline = inline || (!match && !className?.includes("language-") && !className?.includes("hljs"));

            if (match) {
              const chart = String(children).replace(/\n$/, "");
              return <MermaidRenderer chart={chart} />;
            }

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-[13px] font-mono font-medium"
                  style={{
                    backgroundColor: "#3c3836",
                    color: "#fe8019",
                    border: "1px solid #504945"
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const rawLang = (className || "").replace("language-", "").replace("hljs", "").trim();
            const lang = rawLang ? rawLang.toUpperCase() : "CODE";

            return (
              <div
                className="my-4 rounded-xl overflow-hidden page-break-inside-avoid shadow-md"
                style={{
                  backgroundColor: "#1d2021",
                  border: "1px solid #3c3836"
                }}
              >
                {/* Gruvbox Dark Window Header Bar */}
                <div
                  className="px-4 py-2 flex items-center justify-between text-[11px] font-mono font-bold tracking-wider select-none"
                  style={{
                    backgroundColor: "#282828",
                    borderBottom: "1px solid #3c3836",
                    color: "#fabd2f"
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#fb4934" }} />
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#fabd2f" }} />
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#b8bb26" }} />
                    <span className="ml-2 font-bold uppercase tracking-wider text-[#fabd2f]">{lang}</span>
                  </div>
                  <span className="text-[#83a598] font-mono text-[10px] font-medium">Gruvbox Dark</span>
                </div>
                <pre
                  className="p-4 overflow-x-auto text-xs font-mono leading-relaxed m-0"
                  style={{
                    backgroundColor: "#1d2021",
                    color: "#ebdbb2"
                  }}
                >
                  <code className={className} style={{ color: "#ebdbb2" }} {...props}>
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
                  borderLeft: "4px solid #0284c7",
                  backgroundColor: "#f0f9ff",
                  color: "#0369a1"
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
