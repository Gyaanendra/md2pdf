"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      if (!chart.trim()) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "Inter, sans-serif",
          flowchart: { htmlLabels: true, curve: "basis" },
          sequence: { useMaxWidth: true, showSequenceNumbers: true },
        });

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (isMounted) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svg, "image/svg+xml");
          const svgEl = doc.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.style.maxWidth = "100%";
            svgEl.style.width = "auto";
            svgEl.style.height = "auto";
            svgEl.style.margin = "0 auto";
            svgEl.style.display = "block";
            setSvgContent(svgEl.outerHTML);
          } else {
            setSvgContent(svg);
          }
          setError(null);
        }
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError(err?.message || "Failed to render Mermaid diagram");
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-mono">
        <div className="font-semibold mb-1">Mermaid Syntax Error:</div>
        <div>{error}</div>
        <pre className="mt-2 p-2 bg-rose-100/50 rounded overflow-x-auto text-[11px]">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto flex justify-center items-center shadow-xs page-break-inside-avoid"
      dangerouslySetInnerHTML={{ __html: svgContent || `<div class="py-8 text-center text-xs text-slate-400 animate-pulse">Rendering diagram...</div>` }}
    />
  );
}
