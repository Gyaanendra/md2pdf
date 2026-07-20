import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "md2pdf - Markdown to PDF Converter",
  description: "Convert Markdown to print-ready PDF with KaTeX math, chemical formulas, code highlighting, and Mermaid.js diagrams.",
  authors: [{ name: "Gyaanendra", url: "https://github.com/Gyaanendra" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light" style={{ colorScheme: "light" }}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
        <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="beforeInteractive" />
      </head>
      <body className="h-full bg-slate-50 antialiased font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
