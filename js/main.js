// js/main.js - Cleaned version
import { state } from "./state.js";
import { debounce, sortEntries } from "./utils.js";
import { sectionTypes } from "./config.js";
import * as Renderers from "./renderers.js";
import * as Generators from "./generators.js";
import * as Importers from "./importers.js";
import * as Exporters from "./exporters.js";
import { dragDropManager } from "./dragdrop.js";
import * as UI from "./ui.js";
import * as Frontmatter from "./frontmatter.js";

// --- INITIALIZATION ---
window.onload = function () {
  state.load();

  if (state.get().sections.length === 0) {
    state.initDefaults();
  }

  UI.populateFrontmatterInputs();

  // Subscribe to state changes with debounced save
  const debouncedSave = debounce(() => state.save(), 1000);

  state.subscribe(() => {
    debouncedSave();
    debouncedUpdatePreview();

    const locationsContent = document.getElementById("locationsEditorContent");
    if (locationsContent && !locationsContent.classList.contains("hidden")) {
      UI.renderLocationsEditor();
    }
  });

  UI.renderStageSwitcher();
  renderSections();
  renderAddSectionMenu();
  updatePreview();
  UI.updateStageUI();
};

// --- GLOBAL EXPORTS FOR HTML ONCLICK ---
window.saveState = () => state.save();

window.setStage = function (stage) {
  state.setStage(stage);
  renderSections();
  UI.updateStageUI();
};

window.resetState = function () {
  if (
    UI.showConfirmDialog(
      "Are you sure you want to delete ALL data and reset the editor?",
    )
  ) {
    localStorage.removeItem("digestState");
    localStorage.removeItem("gistId");
    sessionStorage.removeItem("gistToken");
    state.reset();
    document.getElementById("docTitle").value = "";
    document.getElementById("docDate").value = "";
    document.getElementById("docTags").value = "";
    state.initDefaults();
    renderSections();
    updatePreview();
    UI.showAlert("Editor has been completely reset.");
  }
};

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
  renderSections();
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
    renderSections();
  }
};

window.deleteSection = function (id) {
  if (UI.showConfirmDialog("Delete this section?")) {
    state.deleteSection(id);
    renderSections();
  }
};

window.addEntry = function (sectionId, type) {
  state.addEntry(sectionId, type);
  renderSections();
};

window.deleteEntry = function (sectionId, entryId) {
  state.deleteEntry(sectionId, entryId);
  renderSections();
};

window.updateEntry = function (sectionId, entryId, field, value) {
  state.updateEntry(sectionId, entryId, field, value);
  // Only re-render for importance changes (button clicks)
  if (field === "importance") {
    renderSections();
  }
};

// Author operations
window.addAuthor = function (sectionId, entryId) {
  state.addAuthor(sectionId, entryId);
  renderSections();
};

window.updateAuthor = function (sectionId, entryId, idx, field, value) {
  state.updateAuthor(sectionId, entryId, idx, field, value);
};

window.deleteAuthor = function (sectionId, entryId, idx) {
  state.deleteAuthor(sectionId, entryId, idx);
  renderSections();
};

// Import/Export
window.exportJSON = Exporters.exportJSON;
window.importJSON = () => document.getElementById("jsonInput").click();
window.handleJSONImport = Importers.handleJSONImport;

window.importZotero = () => document.getElementById("zoteroInput").click();
window.handleZoteroImport = Importers.handleZoteroImport;

window.downloadMarkdown = function () {
  const md = document.getElementById("preview").textContent;
  Exporters.exportMarkdown(md);
};

// Gist operations
window.openGistModal = UI.openGistModal;
window.closeGistModal = UI.closeGistModal;
window.gistAction = UI.performGistAction;

// Locations editor functions
window.toggleLocationsEditor = UI.toggleLocationsEditor;

window.updateLocationEventType = function (sectionId, entryId, newType) {
  const normalizedType = newType.toLowerCase();
  const validTypes = ["conference", "festival", "exhibition"];

  if (validTypes.includes(normalizedType)) {
    state.updateEntry(sectionId, entryId, "type", normalizedType);
    state.updateEntry(sectionId, entryId, "customEventType", "");
  } else {
    state.updateEntry(sectionId, entryId, "type", "conference");
    state.updateEntry(sectionId, entryId, "customEventType", newType);
  }

  renderSections();
  UI.renderLocationsEditor();
};

window.updateLocationCity = function (sectionId, entryId, city) {
  const section = state.findSection(sectionId);
  if (!section) return;
  const entry = section.entries.find((e) => e.id === entryId);
  if (!entry) return;

  const parts = (entry.place || "").split(",").map((p) => p.trim());
  const country = parts.length >= 2 ? parts[parts.length - 1] : "";
  entry.place = country ? `${city}, ${country}` : city;

  state.save();
};

window.updateLocationCountry = function (sectionId, entryId, country) {
  const section = state.findSection(sectionId);
  if (!section) return;
  const entry = section.entries.find((e) => e.id === entryId);
  if (!entry) return;

  const parts = (entry.place || "").split(",").map((p) => p.trim());
  const city = parts[0] || "";
  entry.place = country ? `${city}, ${country}` : city;

  state.save();
};

// --- CORE RENDERING LOGIC ---
export function renderSections() {
  const container = document.getElementById("sectionsContainer");

  // Store scroll position
  const scrollTop = container.scrollTop;

  container.innerHTML = "";

  state.get().sections.forEach((section) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className =
      "mb-6 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700";
    sectionDiv.draggable = true;
    sectionDiv.dataset.sectionId = section.id;

    dragDropManager.attachSectionListeners(sectionDiv);

    let html = `
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-blue-300 cursor-move flex items-center gap-2">
              <span class="text-gray-500 hover:text-white">☰</span> ${section.title}
            </h3>
            <button onclick="deleteSection('${section.id}')" class="text-red-400 hover:text-red-300 text-sm font-semibold hover:bg-red-900/30 px-2 py-1 rounded">Delete</button>
          </div>
        `;

    const entryConfig = getEntryConfig(section.type);
    html += `<button onclick="addEntry('${section.id}', '${entryConfig.type}')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add ${entryConfig.text}</button>`;

    html += '<div class="space-y-4">';

    section.entries.forEach((entry, idx) => {
      html += `<div class="p-3 bg-gray-750 bg-gray-700/50 rounded border border-gray-600 hover:border-gray-500 transition" draggable="false" data-entry-id="${entry.id}" data-section-id="${section.id}">`;

      html += `<div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <span class="entry-drag-handle cursor-move text-gray-500 hover:text-white text-sm select-none" draggable="true" title="Drag to reorder">⋮⋮</span>
          <span class="text-xs text-gray-400 font-mono">Entry ${idx + 1}</span>
        </div>
        <button onclick="deleteEntry('${section.id}', '${entry.id}')" class="text-red-400 hover:text-red-300 text-xs">✕</button>
      </div>`;

      html += renderEntryForm(section.id, entry);
      html += "</div>";
    });
    html += "</div>";

    sectionDiv.innerHTML = html;
    container.appendChild(sectionDiv);

    // Disable section drag when mouse is over inputs (prevents accidental drag)
    sectionDiv.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("mouseenter", () => {
        sectionDiv.draggable = false;
      });
      input.addEventListener("mouseleave", () => {
        sectionDiv.draggable = true;
      });
    });

    // Attach entry drag listeners
    sectionDiv.querySelectorAll("[data-entry-id]").forEach((entryDiv) => {
      const dragHandle = entryDiv.querySelector(".entry-drag-handle");
      if (dragHandle) {
        dragDropManager.attachEntryListeners(entryDiv, dragHandle);
      }

      // Attach blur/change listeners for form inputs
      entryDiv
        .querySelectorAll(
          "input[data-field], textarea[data-field], select[data-field]",
        )
        .forEach((input) => {
          const sectionId = input.dataset.section;
          const entryId = input.dataset.entry;
          const field = input.dataset.field;

          // Handle author fields specially
          if (field.startsWith("author-")) {
            const parts = field.split("-");
            const authorIdx = parseInt(parts[1]);
            const authorField = parts[2];

            input.addEventListener("blur", () => {
              updateAuthor(
                sectionId,
                entryId,
                authorIdx,
                authorField,
                input.value,
              );
            });
          } else {
            // Regular fields
            const eventType = input.type === "checkbox" ? "change" : "blur";
            input.addEventListener(eventType, () => {
              const value =
                input.type === "checkbox" ? input.checked : input.value;
              updateEntry(sectionId, entryId, field, value);
            });
          }
        });
    });
  });

  // Restore scroll position
  container.scrollTop = scrollTop;
}

function getEntryConfig(type) {
  const entryMap = {
    publications: { type: "publication", text: "Publication" },
    journalIssues: { type: "journalIssue", text: "Journal Issue" },
    conferences: { type: "conference", text: "Conference" },
    callForPapers: { type: "callForPapers", text: "Call" },
    festivals: { type: "festival", text: "Festival" },
    exhibitions: { type: "exhibition", text: "Exhibition" },
    media: { type: "media", text: "Media Entry" },
    news: { type: "text", text: "News Item" },
    quickLinks: { type: "text", text: "Link Item" },
    custom: { type: "text", text: "Entry" },
  };
  return entryMap[type] || entryMap["custom"];
}

function renderEntryForm(sectionId, entry) {
  const stage = state.getStage ? state.getStage() : "edit";

  if (entry.type === "publication") {
    return Renderers.renderPublicationForm(sectionId, entry, stage);
  } else if (entry.type === "journalIssue") {
    return Renderers.renderJournalForm(sectionId, entry, stage);
  } else if (["conference", "exhibition", "festival"].includes(entry.type)) {
    return Renderers.renderEventForm(sectionId, entry, stage);
  } else if (entry.type === "callForPapers") {
    return Renderers.renderCallForm(sectionId, entry, stage);
  } else if (entry.type === "media") {
    return Renderers.renderMediaForm(sectionId, entry, stage);
  } else {
    return Renderers.renderTextForm(sectionId, entry, stage);
  }
}

function renderAddSectionMenu() {
  const container = document.getElementById("addSectionMenuContainer");
  container.innerHTML = `
    <div class="mb-6 p-4 bg-gray-800 rounded-lg border border-dashed border-gray-600">
      <h3 class="text-lg font-bold mb-3 text-blue-300">Add Standard Section</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        ${Object.entries(sectionTypes)
          .filter(([key]) => key !== "custom")
          .map(
            ([key, val]) =>
              `<button onclick="addSection('${key}')" class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">${val.icon} ${val.title}</button>`,
          )
          .join("")}
      </div>
    </div>`;
}

export function updatePreview() {
  const data = state.get();
  const locations = Frontmatter.collectLocations(data.sections);
  let md = Frontmatter.generateFrontmatter(data.frontmatter, locations);

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

const debouncedUpdatePreview = debounce(updatePreview, 300);
