import { state } from "./state.js";
import { generateId, sortEntries } from "./utils.js";
import { generateFrontmatter, collectLocations } from "./frontmatter.js";
import * as Generators from "./generators.js";

// === DRAG & DROP ===
class DragDropManager {
  constructor() {
    this.draggedSection = null;
    this.draggedEntry = null;
  }

  handleEntryDragStart(e, entryElement) {
    this.draggedEntry = entryElement;
    entryElement.classList.add("dragging");

    // Fix: Drag image
    e.dataTransfer.setDragImage(entryElement, 0, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", entryElement.dataset.entryId);
  }

  handleEntryDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    const targetEntry = e.currentTarget;

    if (
      !targetEntry ||
      !this.draggedEntry ||
      targetEntry === this.draggedEntry
    ) {
      return;
    }

    // LIVE SORT for Entries
    const targetContainer = targetEntry.parentNode;
    const rect = targetEntry.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    // Determine position
    if (e.clientY < midY) {
      targetContainer.insertBefore(this.draggedEntry, targetEntry);
    } else {
      targetContainer.insertBefore(this.draggedEntry, targetEntry.nextSibling);
    }
  }

  handleEntryDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  handleEntryDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const entryEl = this.draggedEntry;
    if (!entryEl) return;

    entryEl.classList.remove("dragging");

    // 1. Identify context
    const oldSectionId = entryEl.dataset.sectionId;
    const entryId = entryEl.dataset.entryId;

    // The new parent might be different if we dragged across sections
    const newContainer = entryEl.parentNode;
    // Assuming the container is inside the section wrapper
    // We need to find the section ID of the new container.
    // Usually via .closest() or if the container ITSELF has the ID.
    // Based on your code, the entries seem to be in a container inside the section.
    // Let's assume the dragged entry element still has the old dataset until we update it,
    // so we look at the 'target' from the event or the DOM parent.
    const newSectionEl = newContainer.closest("[data-section-id]");
    const newSectionId = newSectionEl
      ? newSectionEl.dataset.sectionId
      : oldSectionId;

    if (!oldSectionId || !newSectionId || !entryId) return;

    // 2. Calculate Indexes
    const oldSecState = state.findSection(oldSectionId);
    const fromIdx = oldSecState.entries.findIndex((en) => en.id === entryId);

    // Find where it landed in the DOM
    const toIdx = Array.from(newContainer.children).indexOf(entryEl);

    // 3. Sync State
    if (fromIdx !== -1 && toIdx !== -1) {
      state.moveEntry(oldSectionId, newSectionId, fromIdx, toIdx);
    }

    this.draggedEntry = null;
  }

  handleEntryDragEnd(e) {
    if (this.draggedEntry) {
      this.draggedEntry.classList.remove("dragging");
    }

    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    this.draggedEntry = null;
  }

  attachEntryListeners(entryElement, dragHandle) {
    // Drag handle initiates the drag
    dragHandle.addEventListener("dragstart", (e) => {
      this.handleEntryDragStart(e, entryElement);
    });

    dragHandle.addEventListener("dragend", (e) => {
      this.handleEntryDragEnd(e);
    });

    // Entry element is the drop target
    entryElement.addEventListener("dragover", (e) => {
      this.handleEntryDragOver(e);
    });

    entryElement.addEventListener("dragleave", (e) => {
      this.handleEntryDragLeave(e);
    });

    entryElement.addEventListener("drop", (e) => {
      this.handleEntryDrop(e);
    });
  }
}

export const dragDropManager = new DragDropManager();

// === HELPER FUNCTIONS ===
function extractDOI(url) {
  if (!url) return null;
  const doiMatch = url.match(/10\.\d{4,}\/[^\s]+/);
  return doiMatch ? doiMatch[0] : null;
}

// === ZOTERO IMPORT (CSL-JSON) ===
export function handleZoteroImport(event, onSuccess, onError) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const cslData = JSON.parse(e.target.result);
      if (!Array.isArray(cslData)) {
        throw new Error("Invalid CSL-JSON: Expected an array of items");
      }

      let pubSection = state
        .get()
        .sections.find((s) => s.type === "publications");
      if (!pubSection) {
        pubSection = state.addSection("publications");
      }

      let importCount = 0;
      let skippedCount = 0;
      const skippedTitles = [];

      cslData.forEach((item) => {
        const title = item.title || "";
        const doi = item.DOI || "";

        // Check for duplicates by title (case-insensitive) or DOI
        const isDuplicate = pubSection.entries.some((existingEntry) => {
          // Match by title (normalized, case-insensitive)
          if (title && existingEntry.title) {
            const normalizedNew = title
              .toLowerCase()
              .trim()
              .replace(/\s+/g, " ");
            const normalizedExisting = existingEntry.title
              .toLowerCase()
              .trim()
              .replace(/\s+/g, " ");
            if (normalizedNew === normalizedExisting) return true;
          }

          // Match by DOI
          if (doi && existingEntry.url) {
            const existingDOI = extractDOI(existingEntry.url);
            if (existingDOI && doi.toLowerCase() === existingDOI.toLowerCase())
              return true;
          }

          return false;
        });

        if (isDuplicate) {
          skippedCount++;
          skippedTitles.push(title);
          return; // Skip this entry
        }

        // Not a duplicate, add it
        const entry = {
          id: generateId(),
          type: "publication",
          authors: item.author
            ? item.author.map((a) => ({
                name: a.given || "",
                surname: a.family || "",
              }))
            : [{ name: "", surname: "" }],
          title: title,
          pubType: mapCSLType(item.type),
          containerTitle: item["container-title"] || "",
          publisher: item.publisher || "",
          date: formatCSLDate(item.issued),
          url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
          urlText: "link",
          openAccess: false,
          abstract: item.abstract || "",
          volume: item.volume || "",
          issue: item.issue || "",
        };
        pubSection.entries.push(entry);
        importCount++;
      });

      state.notify();

      let message = `Successfully imported ${importCount} new item(s) from Zotero!`;
      if (skippedCount > 0) {
        message += `\n\nSkipped ${skippedCount} duplicate(s):\n`;
        message += skippedTitles
          .slice(0, 5)
          .map((t) => `• ${t}`)
          .join("\n");
        if (skippedCount > 5) {
          message += `\n... and ${skippedCount - 5} more`;
        }
      }

      onSuccess(message);
    } catch (err) {
      console.error("Zotero import error:", err);
      onError(`Error importing Zotero data: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function mapCSLType(cslType) {
  const typeMap = {
    book: "Book",
    chapter: "Chapter",
    "article-journal": "Article",
    "article-magazine": "Article",
    "article-newspaper": "Article",
    "paper-conference": "Article",
    thesis: "Thesis",
    webpage: "Online Article",
    "post-weblog": "Blog Post",
  };
  return typeMap[cslType] || "Article";
}

function formatCSLDate(issued) {
  if (!issued) return "";
  if (issued["date-parts"] && issued["date-parts"][0]) {
    return issued["date-parts"][0].join("-");
  }
  if (issued.raw) return issued.raw;
  return "";
}

// === JSON IMPORT/EXPORT ===
export function handleJSONImport(event, onSuccess, onError) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const newState = JSON.parse(e.target.result);

      if (!newState.frontmatter || !newState.sections) {
        throw new Error("Invalid digest file structure");
      }

      state.set(newState);
      onSuccess("Draft imported successfully!");
    } catch (err) {
      console.error("JSON import error:", err);
      onError(`Error importing draft: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

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

// === MARKDOWN EXPORT ===
export function buildDigest(data) {
  const locations = collectLocations(
    data.sections,
    data.frontmatterLocations || [],
  );
  let md = generateFrontmatter(data.frontmatter, locations);
  md += "\n\n";

  // Table of Contents
  md += "## Jump to\n\n";
  for (const section of data.sections) {
    if (section.entries && section.entries.length > 0) {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      // Remove emoji from section title in TOC
      const cleanTitle = section.title
        .replace(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          "",
        )
        .trim();
      md += `- [${cleanTitle}](#${anchor})\n`;
    }
  }
  md += "\n";

  // Sections
  for (const section of data.sections) {
    if (!section.entries || section.entries.length === 0) continue;

    md += `## ${section.title}\n\n`;

    const sortedEntries = sortEntries(section.entries);

    for (const entry of sortedEntries) {
      if (entry.type === "publication") {
        md += Generators.generatePublicationMarkdown(entry);
      } else if (entry.type === "journalIssue") {
        md += Generators.generateJournalMarkdown(entry);
      } else if (
        ["conference", "exhibition", "festival"].includes(entry.type)
      ) {
        md += Generators.generateEventMarkdown(entry);
      } else if (entry.type === "callForPapers") {
        md += Generators.generateCallMarkdown(entry);
      } else if (entry.type === "media") {
        md += Generators.generateMediaMarkdown(entry);
      } else {
        md += `${entry.content || ""}\n\n`;
      }
    }
  }

  return normalizeMarkdown(md);
}

function normalizeMarkdown(md) {
  return (
    md
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim() + "\n"
  );
}

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

// === PERSISTENCE ===
export function loadFromLocalStorage() {
  const saved = localStorage.getItem("digestState");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      console.log(
        "✅ Loaded from localStorage:",
        data.sections.length,
        "sections",
      );
      return data;
    } catch (e) {
      console.error("❌ Error loading state:", e);
      return { frontmatter: {}, sections: [], frontmatterLocations: [] };
    }
  }
  console.log("ℹ️ No saved state found");
  return { frontmatter: {}, sections: [], frontmatterLocations: [] };
}

export function saveToLocalStorage(data, frontmatterFromDOM) {
  const toSave = {
    ...data,
    frontmatter: frontmatterFromDOM || data.frontmatter,
  };
  localStorage.setItem("digestState", JSON.stringify(toSave));
  console.log("💾 Saved to localStorage");
}

export function clearLocalStorage() {
  localStorage.removeItem("digestState");
  localStorage.removeItem("gistId");
  localStorage.removeItem("gistToken");
}
