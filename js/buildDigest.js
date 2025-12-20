import { generateFrontmatter } from "./frontmatter.js";

/**
 * Entry point: build full markdown digest
 */
export function buildDigest(state) {
  let md = "";

  md += generateFrontmatter(state.frontmatter);
  md += "\n\n";

  for (const section of state.sections) {
    if (!section.entries || section.entries.length === 0) continue;

    md += renderSection(section);
    md += "\n";
  }

  return normalizeMarkdown(md);
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if ((b.importance || 2) !== (a.importance || 2)) {
      return (b.importance || 2) - (a.importance || 2);
    }

    if (a.date && b.date && a.date !== b.date) {
      return new Date(b.date) - new Date(a.date);
    }

    return (a.title || "").localeCompare(b.title || "");
  });
}

function renderSection(section) {
  let md = `## ${section.title}\n\n`;

  const entries = sortEntries(section.entries);

  for (const entry of entries) {
    md += renderEntry(entry);
    md += "\n";
  }

  return md;
}

function renderEntry(e) {
  let header = `**${e.title || "Untitled"}**`;

  if (e.location) header += ` — ${e.location}`;
  if (e.date) header += ` (${e.date})`;

  let md = header + "\n";

  if (e.description) {
    md += `${e.description}\n`;
  }

  if (e.note) {
    md += `${e.note}\n`;
  }

  if (e.url) {
    md += `[${e.urlText || "Link"}](${e.url})\n`;
  }

  return md;
}

function normalizeMarkdown(md) {
  return md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim() + "\n";
}