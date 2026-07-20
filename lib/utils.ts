import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFilename(title: string): string {
  const clean = title.replace(/[^a-zA-Z0-9_\s-]/g, "").replace(/\s+/g, "_");
  return (clean || "document") + ".pdf";
}
