// main.js - Think of it as a score, not an instrument
// Allowed: imports, init, wiring, mode toggles
// If you see more than ~200–300 lines, audit it.

import { state } from "./state.js";
import { sectionTypes } from "./config.js";
import { debounce, sortEntries } from "./utils.js";
import { generateFrontmatter, collectLocations } from "./frontmatter.js";
import * as Generators from "./generators.js";
import * as IO from "./io.js";
import * as UI from "./ui.js";
import { gistManager } from "./gist.js";

// === INITIALIZATION ===
window.onload = function () {
  const savedData = IO.loadFromLocalStorage();
  state.set(savedData);

  if (state.get().sections.length === 0) {
    state.addSection("publications");
    state.addSection("conferences");
    state.addSection("news");
  }

  UI.populateFrontmatterInputs(state.get().frontmatter);
  UI.renderSections();
  UI.renderAddSectionMenu();
  updatePreview();

  // Wire up state changes
  const debouncedSave = debounce(() => {
    const frontmatter = UI.getFrontmatterFromDOM();
    IO.saveToLocalStorage(state.get(), frontmatter);
  }, 1000);

  const debouncedPreview = debounce(updatePreview, 300);

  state.subscribe(() => {
    debouncedSave();
    debouncedPreview();
  });

  // Wire up form inputs
  attachFrontmatterListeners();
  attachInputListeners();
};

// === EVENT WIRING ===

function attachFrontmatterListeners() {
  ["docTitle", "docDate", "docTags", "docDraft"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      const frontmatter = UI.getFrontmatterFromDOM();
      IO.saveToLocalStorage(state.get(), frontmatter);
      updatePreview();
    });
  });
}

function attachInputListeners() {
  // Delegate event listeners to sections container
  const container = document.getElementById("sectionsContainer");

  container.addEventListener(
    "blur",
    (e) => {
      if (!e.target.dataset.field) return;

      const sectionId = e.target.dataset.section;
      const entryId = e.target.dataset.entry;
      const field = e.target.dataset.field;

      if (field.startsWith("author-")) {
        const parts = field.split("-");
        const authorIdx = parseInt(parts[1]);
        const authorField = parts[2];
        state.updateAuthor(
          sectionId,
          entryId,
          authorIdx,
          authorField,
          e.target.value,
        );
      } else {
        const value =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;
        state.updateEntry(sectionId, entryId, field, value);
      }
    },
    true,
  );

  container.addEventListener(
    "change",
    (e) => {
      if (e.target.type === "checkbox" && e.target.dataset.field) {
        const sectionId = e.target.dataset.section;
        const entryId = e.target.dataset.entry;
        const field = e.target.dataset.field;
        state.updateEntry(sectionId, entryId, field, e.target.checked);
      }
    },
    true,
  );
}

// === GLOBAL FUNCTIONS (exposed for onclick handlers) ===

window.addSection = function (type) {
  const existingSection = state.get().sections.find((s) => s.type === type);
  if (existingSection) {
    const sectionName = sectionTypes[type]?.title || type;
    if (
      !UI.showConfirmDialog(
        `A "${sectionName}" section already exists. Are you sure you want to create another one?`,
      )
    ) {
      return;
    }
  }
  state.addSection(type);
  UI.renderSections();
};

window.addCustomSection = function () {
  const title = UI.showPromptDialog("Enter Custom Section Title:");
  if (title) {
    const existingSection = state
      .get()
      .sections.find((s) => s.title.toLowerCase() === title.toLowerCase());
    if (existingSection) {
      if (
        !UI.showConfirmDialog(
          `A section named "${title}" already exists. Create another one with the same name?`,
        )
      ) {
        return;
      }
    }
    state.addSection("custom", title);
    UI.renderSections();
  }
};

window.deleteSection = function (id) {
  if (UI.showConfirmDialog("Delete this section?")) {
    state.deleteSection(id);
    UI.renderSections();
  }
};

window.addEntry = function (sectionId, type) {
  state.addEntry(sectionId, type);
  UI.renderSections();
};

window.deleteEntry = function (sectionId, entryId) {
  state.deleteEntry(sectionId, entryId);
  UI.renderSections();
};

window.updateEntry = function (sectionId, entryId, field, value) {
  state.updateEntry(sectionId, entryId, field, value);
  if (field === "importance") {
    UI.renderSections();
  }
};

window.addAuthor = function (sectionId, entryId) {
  state.addAuthor(sectionId, entryId);
  UI.renderSections();
};

window.deleteAuthor = function (sectionId, entryId, idx) {
  state.deleteAuthor(sectionId, entryId, idx);
  UI.renderSections();
};

window.resetState = function () {
  if (
    UI.showConfirmDialog(
      "Are you sure you want to delete ALL data and reset the editor?",
    )
  ) {
    IO.clearLocalStorage();
    state.set({ frontmatter: {}, sections: [] });
    document.getElementById("docTitle").value = "";
    document.getElementById("docDate").value = "";
    document.getElementById("docTags").value = "";
    state.addSection("publications");
    state.addSection("conferences");
    state.addSection("news");
    UI.renderSections();
    updatePreview();
    UI.showAlert("Editor has been completely reset.");
  }
};

// === IMPORT/EXPORT ===

window.exportJSON = IO.exportJSON;
window.importJSON = () => document.getElementById("jsonInput").click();
window.handleJSONImport = (event) => {
  IO.handleJSONImport(
    event,
    (msg) => {
      UI.populateFrontmatterInputs(state.get().frontmatter);
      UI.renderSections();
      updatePreview();
      UI.showAlert(msg);
    },
    (msg) => UI.showAlert(msg),
  );
};

window.importZotero = () => document.getElementById("zoteroInput").click();
window.handleZoteroImport = (event) => {
  IO.handleZoteroImport(
    event,
    (msg) => {
      UI.renderSections();
      updatePreview();
      UI.showAlert(msg);
    },
    (msg) => UI.showAlert(msg),
  );
};

window.downloadMarkdown = IO.exportMarkdown;

// === GIST ===

let currentGistAction = "";

window.openGistModal = function (action) {
  currentGistAction = action;
  const modal = document.getElementById("gistModal");
  const title = document.getElementById("gistModalTitle");
  const button = document.getElementById("gistActionButton");

  const persistedToken = localStorage.getItem("gistToken");
  const persistedId = localStorage.getItem("gistId");

  document.getElementById("gistToken").value = persistedToken || "";
  document.getElementById("gistId").value = persistedId || "";

  if (action === "save") {
    title.textContent = "Save Draft to Gist";
    button.textContent = persistedId
      ? "Update Existing Gist"
      : "Create New Gist";
  } else if (action === "load") {
    title.textContent = "Load Draft from Gist";
    button.textContent = "Load Draft";
  }

  modal.style.display = "flex";
};

window.closeGistModal = function () {
  document.getElementById("gistModal").style.display = "none";
};

window.gistAction = async function () {
  const actionButton = document.getElementById("gistActionButton");
  actionButton.disabled = true;
  actionButton.textContent = "Processing...";

  try {
    if (currentGistAction === "save") {
      const gistId = await gistManager.save(state.get());
      document.getElementById("gistId").value = gistId;
      actionButton.textContent = "Update Existing Gist";
      alert(`Draft successfully saved! Gist ID: ${gistId}`);
    } else if (currentGistAction === "load") {
      const loadedState = await gistManager.load();
      state.set(loadedState);
      UI.populateFrontmatterInputs(state.get().frontmatter);
      UI.renderSections();
      updatePreview();
      alert("Draft loaded successfully from Gist!");
    }
  } catch (error) {
    alert(error.message);
  } finally {
    actionButton.disabled = false;
    actionButton.textContent = "Perform Action";
    window.closeGistModal();
  }
};

// === PREVIEW ===

function updatePreview() {
  const data = state.get();
  const frontmatter = UI.getFrontmatterFromDOM();
  const locations = collectLocations(data.sections);

  let md = generateFrontmatter(frontmatter, locations);

  md += "## Table of Contents\n\n";
  data.sections.forEach((section) => {
    if (section.entries.length > 0) {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      md += `- [${section.title}](#${anchor})\n`;
    }
  });
  md += "\n";

  data.sections.forEach((section) => {
    if (section.entries.length === 0) return;
    md += `## ${section.title}\n\n`;

    const sortedEntries = sortEntries(section.entries);

    sortedEntries.forEach((entry) => {
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
    });
  });

  document.getElementById("preview").textContent = md;
}
