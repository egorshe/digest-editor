// io.js - Where mess lives
// Zotero edge cases, drag & drop, JSON vs MD quirks, legacy compatibility
// Not allowed: UI rendering, markdown generation (call generators instead)

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

  handleSectionDragStart(e) {
    this.draggedSection = e.currentTarget;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  handleSectionDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (
      this.draggedSection &&
      e.currentTarget.dataset.sectionId &&
      this.draggedSection !== e.currentTarget
    ) {
      const fromIdx = state
        .get()
        .sections.findIndex(
          (s) => s.id === this.draggedSection.dataset.sectionId,
        );
      const toIdx = state
        .get()
        .sections.findIndex((s) => s.id === e.currentTarget.dataset.sectionId);

      if (fromIdx !== toIdx && fromIdx !== -1 && toIdx !== -1) {
        state.moveSection(fromIdx, toIdx);
      }
    }

    e.currentTarget.classList.remove("drag-over");
  }

  handleEntryDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.draggedEntry && e.currentTarget.dataset.entryId) {
      const draggedSectionId = this.draggedEntry.dataset.sectionId;
      const targetSectionId = e.currentTarget.dataset.sectionId;

      if (draggedSectionId && targetSectionId) {
        const fromSec = state.findSection(draggedSectionId);
        const toSec = state.findSection(targetSectionId);

        const fromEntryIdx = fromSec.entries.findIndex(
          (entry) => entry.id === this.draggedEntry.dataset.entryId,
        );
        const toEntryIdx = toSec.entries.findIndex(
          (entry) => entry.id === e.currentTarget.dataset.entryId,
        );

        if (fromSec && toSec && fromEntryIdx !== -1 && toEntryIdx !== -1) {
          state.moveEntry(
            draggedSectionId,
            targetSectionId,
            fromEntryIdx,
            toEntryIdx,
          );
        }
      }
    }

    e.currentTarget.classList.remove("drag-over");
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  handleDragEnd(e) {
    if (this.draggedSection) {
      this.draggedSection.classList.remove("dragging");
    }
    if (this.draggedEntry) {
      this.draggedEntry.classList.remove("dragging");
    }

    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    this.draggedSection = null;
    this.draggedEntry = null;
  }

  attachSectionListeners(element) {
    element.addEventListener(
      "dragstart",
      this.handleSectionDragStart.bind(this),
    );
    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("dragleave", this.handleDragLeave.bind(this));
    element.addEventListener("drop", this.handleSectionDrop.bind(this));
    element.addEventListener("dragend", this.handleDragEnd.bind(this));
  }

  attachEntryListeners(element, dragHandle) {
    dragHandle.addEventListener("dragstart", (e) => {
      this.draggedEntry = element;
      element.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    });

    dragHandle.addEventListener("dragend", this.handleDragEnd.bind(this));

    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("dragleave", this.handleDragLeave.bind(this));
    element.addEventListener("drop", this.handleEntryDrop.bind(this));
  }
}

export const dragDropManager = new DragDropManager();

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
      cslData.forEach((item) => {
        const entry = {
          id: generateId(),
          type: "publication",
          authors: item.author
            ? item.author.map((a) => ({
                name: a.given || "",
                surname: a.family || "",
              }))
            : [{ name: "", surname: "" }],
          title: item.title || "",
          pubType: mapCSLType(item.type),
          containerTitle: item["container-title"] || "",
          publisher: item.publisher || "",
          date: formatCSLDate(item.issued),
          url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
          urlText: "link",
          openAccess: false,
          abstract: item.abstract || "",
        };
        pubSection.entries.push(entry);
        importCount++;
      });

      state.notify();
      onSuccess(`Successfully imported ${importCount} items from Zotero!`);
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
  const locations = collectLocations(data.sections);
  let md = generateFrontmatter(data.frontmatter, locations);
  md += "\n\n";

  // Table of Contents
  md += "## Table of Contents\n\n";
  for (const section of data.sections) {
    if (section.entries && section.entries.length > 0) {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      md += `- [${section.title}](#${anchor})\n`;
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
      return { frontmatter: {}, sections: [] };
    }
  }
  console.log("ℹ️ No saved state found");
  return { frontmatter: {}, sections: [] };
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
