// js/exporters.js - Export functionality
import { state } from "./state.js";

export function exportJSON() {
  const json = JSON.stringify(state.get(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "digest-draft.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(markdownContent) {
  const blob = new Blob([markdownContent], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const title = state.get().frontmatter.title || "digest";
  const filename = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
  a.download = filename;

  a.click();
  URL.revokeObjectURL(url);
}
