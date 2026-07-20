import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFilename(title: string): string {
  const clean = title.replace(/[^a-zA-Z0-9_\s-]/g, "").replace(/\s+/g, "_");
  return (clean || "document") + ".pdf";
}

export function extractMarkdownTitle(markdown: string): string {
  if (!markdown || !markdown.trim()) return "Document";

  // 1. Check for H1 heading: # Title
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1].trim()) {
    return cleanTitleString(h1Match[1]);
  }

  // 2. Check for H2 heading: ## Title
  const h2Match = markdown.match(/^##\s+(.+)$/m);
  if (h2Match && h2Match[1].trim()) {
    return cleanTitleString(h2Match[1]);
  }

  // 3. Fallback: First non-empty text line
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("---") && !trimmed.startsWith("```") && !trimmed.startsWith(">")) {
      return cleanTitleString(trimmed);
    }
  }

  return "Document";
}

function cleanTitleString(str: string): string {
  return str
    .replace(/[\*\_`~\[\]\(\)>#]/g, "")
    .trim()
    .slice(0, 60);
}
