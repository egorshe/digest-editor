import { sectionTypes } from "./config.js";
import { generateId } from "./utils.js";

class DigestState {
  constructor() {
    this.data = {
      frontmatter: {},
      sections: [],
      frontmatterLocations: [], // Store location overrides
    };
    this.listeners = [];
  }

  get() {
    return this.data;
  }

  set(newData) {
    this.data = newData;
    // Ensure frontmatterLocations exists
    if (!this.data.frontmatterLocations) {
      this.data.frontmatterLocations = [];
    }
    this.notify();
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
    const section = {
      id: generateId(),
      type: type,
      title: customTitle || sectionTypes[type].title,
      entries: [],
    };
    this.data.sections.push(section);
    this.notify();
    return section;
  }

  deleteSection(id) {
    this.data.sections = this.data.sections.filter((s) => s.id !== id);
    this.notify();
  }

  moveSection(fromIdx, toIdx) {
    const [removed] = this.data.sections.splice(fromIdx, 1);
    this.data.sections.splice(toIdx, 0, removed);
    this.notify();
  }

  // Move a section up one slot
  moveSectionUp(id) {
    const idx = this.data.sections.findIndex((s) => s.id === id);
    if (idx > 0) {
      const [section] = this.data.sections.splice(idx, 1);
      this.data.sections.splice(idx - 1, 0, section);
      this.notify();
    }
  }

  // Move a section down one slot
  moveSectionDown(id) {
    const idx = this.data.sections.findIndex((s) => s.id === id);
    if (idx !== -1 && idx < this.data.sections.length - 1) {
      const [section] = this.data.sections.splice(idx, 1);
      this.data.sections.splice(idx + 1, 0, section);
      this.notify();
    }
  }

  reorderSections(newIdOrder) {
    this.data.sections.sort((a, b) => {
      return newIdOrder.indexOf(a.id) - newIdOrder.indexOf(b.id);
    });
    this.notify();
  }

  findSection(id) {
    return this.data.sections.find((s) => s.id === id);
  }

  // Entry operations
  addEntry(sectionId, type) {
    const section = this.findSection(sectionId);
    if (!section) return null;

    const entry = {
      id: generateId(),
      type: type,
      importance: 2,
      whyItMatters: "",
      signal: "",
    };

    // Initialize type-specific defaults
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
    this.notify();
    return entry;
  }

  deleteEntry(sectionId, entryId) {
    const section = this.findSection(sectionId);
    if (!section) return;

    section.entries = section.entries.filter((e) => e.id !== entryId);

    // Also remove from frontmatterLocations
    this.data.frontmatterLocations = this.data.frontmatterLocations.filter(
      (loc) => loc.entryId !== entryId,
    );

    this.notify();
  }

  updateEntry(sectionId, entryId, field, value) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry) return;

    const booleanFields = ["openAccess", "draft"];
    if (booleanFields.includes(field)) {
      entry[field] = !!value;
    } else {
      entry[field] = value;
    }

    this.notify();
  }

  moveEntry(fromSectionId, toSectionId, fromIdx, toIdx) {
    const fromSec = this.findSection(fromSectionId);
    const toSec = this.findSection(toSectionId);

    if (!fromSec || !toSec) return;

    const [movedEntry] = fromSec.entries.splice(fromIdx, 1);
    toSec.entries.splice(toIdx, 0, movedEntry);
    this.notify();
  }

  // Author operations
  addAuthor(sectionId, entryId) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors) return;

    entry.authors.push({ name: "", surname: "" });
    this.notify();
  }

  updateAuthor(sectionId, entryId, idx, field, value) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors || !entry.authors[idx]) return;

    entry.authors[idx][field] = value;
    this.notify();
  }

  deleteAuthor(sectionId, entryId, idx) {
    const section = this.findSection(sectionId);
    if (!section) return;

    const entry = section.entries.find((e) => e.id === entryId);
    if (!entry || !entry.authors) return;

    entry.authors.splice(idx, 1);
    this.notify();
  }

  // Frontmatter location operations
  updateFrontmatterLocation(entryId, field, value) {
    if (!this.data.frontmatterLocations) {
      this.data.frontmatterLocations = [];
    }

    let location = this.data.frontmatterLocations.find(
      (loc) => loc.entryId === entryId,
    );

    if (!location) {
      location = { entryId };
      this.data.frontmatterLocations.push(location);
    }

    location[field] = value;
    this.notify();
  }
}

export const state = new DigestState();
