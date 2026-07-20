import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "md2pdf — Markdown to PDF Converter",
  description: "Convert Markdown into print-ready PDFs with math formulas, chemical equations, code highlighting, and Mermaid diagrams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
