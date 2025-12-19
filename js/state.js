// js/state.js - Refactored with proper state management
import { sectionTypes } from "./config.js";
import { generateId } from "./utils.js";

class DigestState {
  constructor() {
    this.data = {
      frontmatter: {},
      sections: [],
    };
    this.listeners = [];
  }

  get() {
    return this.data;
  }

  update(newData) {
    this.data = newData;
    this.save();
    this.notify();
  }

  updateFrontmatter(field, value) {
    this.data.frontmatter[field] = value;
    this.save();
    this.notify();
  }

  save() {
    const titleEl = document.getElementById("docTitle");
    if (titleEl) {
      this.data.frontmatter = {
        title: document.getElementById("docTitle").value,
        date: document.getElementById("docDate").value,
        tags: document
          .getElementById("docTags")
          .value.split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        draft: document.getElementById("docDraft").value === "true",
      };
    }
    localStorage.setItem("digestState", JSON.stringify(this.data));
    console.log("💾 State saved and notifying preview...");
    this.notify(); // FIX: Added this to trigger the preview update
  }

  load() {
    const saved = localStorage.getItem("digestState");
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        console.log(
          "✅ State loaded from localStorage:",
          this.data.sections.length,
          "sections",
        );
      } catch (e) {
        console.error("❌ Error loading state:", e);
        this.data = { frontmatter: {}, sections: [] };
      }
    } else {
      console.log("ℹ️ No saved state found in localStorage");
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.data));
  }

  // Section operations
  addSection(type, customTitle = null) {
    const section = this.createSectionObject(type, customTitle);
    this.data.sections.push(section);
    this.save();
    this.notify();
    return section;
  }

  deleteSection(id) {
    this.data.sections = this.data.sections.filter((s) => s.id !== id);
    this.save();
    this.notify();
  }

  moveSection(fromIdx, toIdx) {
    const [removed] = this.data.sections.splice(fromIdx, 1);
    this.data.sections.splice(toIdx, 0, removed);
    this.save();
    this.notify();
  }

  findSection(id) {
    return this.data.sections.find((s) => s.id === id);
  }

  // Entry operations
  addEntry(sectionId, type) {
    const section = this.findSection(sectionId);
    if (!section) return null;

    const entry = { id: generateId(), type: type };

    // Initialize defaults based on type
    if (type === "publication") {
      entry.authors = [{ name: "", surname: "" }];
      entry.pubType = "Article";
      entry.urlText = "link";
    } else if (type === "journalIssue") {
      entry.journalName = "";
      entry.volume = "";
      entry.issue = "";
      entry.date = "";
      entry.theme = "";
      entry.guestEditor = "";
      entry.urlText = "link";
      entry.openAccess = false;
      entry.description = "";
    }

    section.entries.push(entry);
    this.save();
    this.notify();
    return entry;
  }

  deleteEntry(sectionId, entryId) {
    const section = this.findSection(sectionId);
    if (!section) return;

    section.entries = section.entries.filter((e) => e.id !== entryId);
    this.save();
    this.notify();
  }

  updateEntry(sectionId, entryId, field, value) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry) return;

    // Handle checkbox value conversion
    entry[field] = typeof entry[field] === "boolean" ? !!value : value;
    this.save();
    this.notify();
  }

  moveEntry(fromSectionId, toSectionId, fromIdx, toIdx) {
    const fromSec = this.findSection(fromSectionId);
    const toSec = this.findSection(toSectionId);

    if (!fromSec || !toSec) return;

    const [movedEntry] = fromSec.entries.splice(fromIdx, 1);
    toSec.entries.splice(toIdx, 0, movedEntry);
    this.save();
    this.notify();
  }

  // Author operations
  addAuthor(sectionId, entryId) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors) return;

    entry.authors.push({ name: "", surname: "" });
    this.save();
    this.notify();
  }

  updateAuthor(sectionId, entryId, idx, field, value) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors || !entry.authors[idx]) return;

    entry.authors[idx][field] = value;
    this.save();
    this.notify();
  }

  deleteAuthor(sectionId, entryId, idx) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors) return;

    entry.authors.splice(idx, 1);
    this.save();
    this.notify();
  }

  // Utility methods
  createSectionObject(type, customTitle = null) {
    return {
      id: generateId(),
      type: type,
      title: customTitle || sectionTypes[type].title,
      entries: [],
    };
  }

  initDefaults() {
    // Only initialize if truly empty (no sections at all)
    if (this.data.sections.length === 0) {
      this.data.sections.push(this.createSectionObject("publications"));
      this.data.sections.push(this.createSectionObject("conferences"));
      this.data.sections.push(this.createSectionObject("news"));
    }
    this.save();
    this.notify();
  }

  reset() {
    this.data = { frontmatter: {}, sections: [] };
    localStorage.removeItem("digestState");
    this.notify();
  }
}

export const state = new DigestState();
