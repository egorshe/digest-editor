// js/exporters.js - Export functionality
import { state } from "./state.js";
import { buildDigest } from "./buildDigest.js";

/**
 * Export raw state as JSON (for backup / debugging)
 */
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

/*** Build and download Markdown digest*/

export function exportMarkdown() {
  const md = buildDigest(state.get());

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  const title = state.get().frontmatter.title || "digest";
  a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;

  a.click();
  URL.revokeObjectURL(url);
}
