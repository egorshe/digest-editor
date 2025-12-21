import { generateFrontmatter, collectLocations } from "./frontmatter.js";
import { sortEntries } from "./utils.js";
import * as Generators from "./generators.js";

/**
 * Entry point: build full markdown digest
 */
export function buildDigest(state) {
  let md = "";

  // Generate frontmatter with locations
  const locations = collectLocations(state.sections);
  md += generateFrontmatter(state.frontmatter, locations);
  md += "\n\n";

  // Generate Table of Contents
  md += "## Table of Contents\n\n";
  for (const section of state.sections) {
    if (section.entries && section.entries.length > 0) {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      md += `- [${section.title}](#${anchor})\n`;
    }
  }
  md += "\n";

  // Generate sections
  for (const section of state.sections) {
    if (!section.entries || section.entries.length === 0) continue;

    md += renderSection(section);
    md += "\n";
  }

  return normalizeMarkdown(md);
}

function renderSection(section) {
  let md = `## ${section.title}\n\n`;

  // Use shared sorting utility
  const entries = sortEntries(section.entries);

  for (const entry of entries) {
    md += renderEntry(entry);
  }

  return md;
}

function renderEntry(entry) {
  // Use the same generators as the preview to ensure consistency
  if (entry.type === "publication") {
    return Generators.generatePublicationMarkdown(entry);
  } else if (entry.type === "journalIssue") {
    return Generators.generateJournalMarkdown(entry);
  } else if (["conference", "exhibition", "festival"].includes(entry.type)) {
    return Generators.generateEventMarkdown(entry);
  } else if (entry.type === "callForPapers") {
    return Generators.generateCallMarkdown(entry);
  } else if (entry.type === "media") {
    return Generators.generateMediaMarkdown(entry);
  } else {
    // Text entries (for custom sections, news, quick links, etc.)
    return `${entry.content || ""}\n\n`;
  }
}

function normalizeMarkdown(md) {
  return (
    md
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim() + "\n"
  );
}
