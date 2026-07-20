"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsRendered(false);

    async function renderDiagram() {
      if (!chart.trim()) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "'Inter', -apple-system, sans-serif",
          themeVariables: {
            primaryColor: "#f1f5f9",
            primaryBorderColor: "#94a3b8",
            primaryTextColor: "#0f172a",
            lineColor: "#475569",
            secondaryColor: "#e2e8f0",
            tertiaryColor: "#ffffff",
            nodeBorder: "#94a3b8",
            clusterBkg: "#f8fafc",
            clusterBorder: "#cbd5e1",
            titleColor: "#0f172a",
            edgeLabelBackground: "#ffffff",
          },
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
            svgEl.style.maxHeight = "250px";
            svgEl.style.width = "auto";
            svgEl.style.height = "auto";
            svgEl.style.margin = "0 auto";
            svgEl.style.display = "block";
            svgEl.style.backgroundColor = "#ffffff";
            setSvgContent(svgEl.outerHTML);
          } else {
            setSvgContent(svg);
          }
          setError(null);
          setIsRendered(true);
        }
      } catch (err: any) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError(err?.message || "Failed to render Mermaid diagram");
          setIsRendered(true);
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
      <div
        data-rendered="true"
        className="my-3 p-3 rounded-lg text-xs font-mono"
        style={{ backgroundColor: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }}
      >
        <div className="font-semibold mb-1">Mermaid Syntax Error:</div>
        <div>{error}</div>
        <pre
          className="mt-2 p-2 rounded overflow-x-auto text-[11px]"
          style={{ backgroundColor: "#ffe4e6" }}
        >
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-rendered={isRendered ? "true" : "false"}
      className="mermaid-wrapper my-3 p-3 rounded-xl overflow-x-auto flex justify-center items-center page-break-inside-avoid"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      dangerouslySetInnerHTML={{ __html: svgContent || `<div class="py-6 text-center text-xs text-slate-400 animate-pulse">Rendering diagram...</div>` }}
    />
  );
}
