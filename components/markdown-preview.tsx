"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import MermaidRenderer from "./mermaid-renderer";
import "katex/dist/katex.min.css";

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).katexMhchemLoaded) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js";
      script.async = true;
      script.onload = () => {
        (window as any).katexMhchemLoaded = true;
      };
      document.head.appendChild(script);
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
                  className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-200/60"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-4 rounded-xl border border-slate-200 overflow-hidden shadow-xs page-break-inside-avoid bg-slate-900">
                <div className="bg-slate-800/90 px-4 py-1.5 border-b border-slate-700/80 flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>{(className || "").replace("language-", "").toUpperCase() || "CODE"}</span>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-100 overflow-x-auto text-xs font-mono leading-relaxed">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table({ children }) {
            return (
              <div className="my-6 overflow-x-auto border border-slate-200 rounded-xl page-break-inside-avoid shadow-xs">
                <table className="w-full text-left text-sm border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border-t border-slate-100 text-slate-600">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 pl-4 pr-3 py-2 border-l-4 border-blue-500 bg-blue-50/60 text-slate-700 rounded-r-lg italic text-sm">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return <h1 className="text-3xl font-extrabold text-slate-900 pb-3 mb-6 border-b border-slate-200 text-center tracking-tight">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold text-slate-800 pt-6 pb-2 mb-4 border-b border-slate-100 tracking-tight">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-slate-800 pt-4 mb-3 tracking-tight">{children}</h3>;
          },
          hr() {
            return <hr className="my-8 border-t border-slate-200" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
