import { state } from "./state.js";
import { sectionTypes } from "./config.js";
import { debounce, sortEntries, toTitleCase } from "./utils.js";
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

      // Handle event type selector
      if (e.target.dataset.field === "eventTypeSelector") {
        const entryId = e.target.dataset.entry;
        const customInput = document.getElementById(
          `customEventType_${entryId}`,
        );

        if (e.target.value === "Custom") {
          if (customInput) customInput.classList.remove("hidden");
        } else {
          if (customInput) {
            customInput.classList.add("hidden");
            customInput.value = "";
          }
          // Clear customEventType
          state.updateEntry(
            e.target.dataset.section,
            entryId,
            "customEventType",
            "",
          );
        }
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

window.moveSectionUp = function (id) {
  state.moveSectionUp(id);
  UI.renderSections();
  updatePreview();
};

window.moveSectionDown = function (id) {
  state.moveSectionDown(id);
  UI.renderSections();
  updatePreview();
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
    state.set({ frontmatter: {}, sections: [], frontmatterLocations: [] });
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

window.normalizeTitles = function () {
  let count = 0;
  const sections = state.get().sections;

  sections.forEach((section) => {
    section.entries.forEach((entry) => {
      if (entry.title && entry.title.trim()) {
        const normalized = toTitleCase(entry.title);
        if (normalized !== entry.title) {
          entry.title = normalized;
          count++;
        }
      }
    });
  });

  if (count > 0) {
    state.notify();
    UI.renderSections();
    updatePreview();
    UI.showAlert(`Normalized ${count} title(s) to Title Case.`);
  } else {
    UI.showAlert("No titles needed normalization.");
  }
};

window.toggleLocationsEditor = function () {
  const content = document.getElementById("locationsEditorContent");
  const icon = document.getElementById("locationsToggleIcon");

  if (content.classList.contains("hidden")) {
    content.classList.remove("hidden");
    icon.classList.add("rotated");
    renderLocationsEditor();
  } else {
    content.classList.add("hidden");
    icon.classList.remove("rotated");
  }
};

window.updateLocationField = function (entryId, field, value) {
  state.updateFrontmatterLocation(entryId, field, value);
  updatePreview();
};

function renderLocationsEditor() {
  const container = document.getElementById("locationsEditorContainer");
  const locations = collectLocations(
    state.get().sections,
    state.get().frontmatterLocations || [],
  );

  if (locations.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-500 italic">No event locations found. Add conferences, exhibitions, or festivals to see them here.</p>';
    return;
  }

  let html = '<div class="space-y-4">';
  locations.forEach((loc, idx) => {
    const entryId = loc.entryId;

    html += `
      <div class="p-3 bg-gray-700 rounded border border-gray-600">
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-gray-400 mb-1">Display Title (in frontmatter)</label>
            <input
              type="text"
              value="${escapeHtml(loc.title || "")}"
              class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none text-sm"
              data-entry-id="${entryId}"
              data-location-field="title"
              onblur="updateLocationField('${entryId}', 'title', this.value)"
            >
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-gray-400">City: <span class="text-gray-300">${loc.city || "N/A"}</span></div>
            <div class="text-gray-400">Country: <span class="text-gray-300">${loc.country || "N/A"}</span></div>
            <div class="text-gray-400">Venue: <span class="text-gray-300">${loc.venue || "N/A"}</span></div>
            <div class="text-gray-400">Date: <span class="text-gray-300">${loc.date || "N/A"}</span></div>
            ${loc.coords.length === 2 ? `<div class="col-span-2 text-gray-400">Coords: <span class="text-gray-300">${loc.coords.join(", ")}</span></div>` : ""}
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Description (in frontmatter)</label>
            <textarea
              class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none text-sm h-16"
              data-entry-id="${entryId}"
              data-location-field="description"
              onblur="updateLocationField('${entryId}', 'description', this.value)"
            >${escapeHtml(loc.description || "")}</textarea>
          </div>

          <div class="text-xs text-gray-500 italic">
            Note: City, Country, Venue, Date, and Coords come from the entry and cannot be edited here.
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";

  container.innerHTML = html;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

// === GIST FUNCTIONS (Updated with Discovery) ===

let currentGistAction = "";

window.openGistModal = async function (action) {
  currentGistAction = action;
  const modal = document.getElementById("gistModal");
  const title = document.getElementById("gistModalTitle");
  const button = document.getElementById("gistActionButton");

  const persistedToken = localStorage.getItem("gistToken");
  const persistedId = localStorage.getItem("gistId");

  document.getElementById("gistToken").value = persistedToken || "";
  document.getElementById("gistId").value = persistedId || "";

  // Reset the gist list container
  const gistIdContainer = document.getElementById("gistIdContainer");
  gistIdContainer.innerHTML = `
    <label class="block text-sm mb-1 text-gray-400">Gist ID (Leave empty to create a new Gist)</label>
    <input
      type="text"
      id="gistId"
      placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j"
      value="${persistedId || ""}"
      class="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
    />
  `;

  if (action === "save") {
    title.textContent = "Save Draft to Gist";
    button.textContent = persistedId
      ? "Update Existing Gist"
      : "Create New Gist";
  } else if (action === "load") {
    title.textContent = "Load Draft from Gist";
    button.textContent = "Load Draft";

    // Auto-populate gist list if token is available
    if (persistedToken) {
      await populateGistList();
    } else {
      // Show a button to load gists once token is entered
      gistIdContainer.innerHTML += `
        <button
          onclick="refreshGistList()"
          class="mt-2 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition"
        >
          🔍 Find My Digest Drafts
        </button>
      `;
    }
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
      const frontmatter = UI.getFrontmatterFromDOM();
      const gistId = await gistManager.save({ ...state.get(), frontmatter });
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
    if (currentGistAction === "save") {
      const persistedId = localStorage.getItem("gistId");
      actionButton.textContent = persistedId
        ? "Update Existing Gist"
        : "Create New Gist";
    } else {
      actionButton.textContent = "Load Draft";
    }
    window.closeGistModal();
  }
};

// NEW: Populate the gist list dropdown
window.populateGistList = async function () {
  const gistIdContainer = document.getElementById("gistIdContainer");

  try {
    gistIdContainer.innerHTML =
      '<p class="text-xs text-gray-400">🔄 Loading your digest drafts...</p>';

    const gists = await gistManager.listUserGists();

    if (gists.length === 0) {
      gistIdContainer.innerHTML = `
        <p class="text-sm text-gray-400 mb-2">No digest drafts found in your Gists.</p>
        <label class="block text-sm mb-1 text-gray-400">Gist ID (Manual Entry)</label>
        <input
          type="text"
          id="gistId"
          placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j"
          class="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      `;
      return;
    }

    let html =
      '<label class="block text-sm mb-1 text-gray-400">📚 Your Digest Drafts:</label>';
    html +=
      '<select id="gistSelector" class="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm mb-2">';
    html += '<option value="">-- Select a Gist to Load --</option>';

    gists.forEach((gist) => {
      const date = new Date(gist.updated_at).toLocaleString();
      const description = gist.description || "Untitled Draft";
      html += `<option value="${gist.id}">${description} (Updated: ${date})</option>`;
    });

    html += "</select>";
    html += '<div class="flex gap-2">';
    html +=
      '<button onclick="loadSelectedGist()" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition">📥 Load Selected</button>';
    html +=
      '<button onclick="refreshGistList()" class="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm transition">🔄</button>';
    html += "</div>";

    html += '<div class="mt-3 pt-3 border-t border-gray-600">';
    html +=
      '<label class="block text-sm mb-1 text-gray-400">Or enter Gist ID manually:</label>';
    html +=
      '<input type="text" id="gistId" placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j" class="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none" />';
    html += "</div>";

    gistIdContainer.innerHTML = html;
  } catch (error) {
    gistIdContainer.innerHTML = `
      <p class="text-xs text-red-400 mb-2">❌ Error loading Gists: ${error.message}</p>
      <label class="block text-sm mb-1 text-gray-400">Gist ID (Manual Entry)</label>
      <input
        type="text"
        id="gistId"
        placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j"
        class="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />
      <button
        onclick="refreshGistList()"
        class="mt-2 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition"
      >
        🔄 Try Again
      </button>
    `;
  }
};

// NEW: Load the selected Gist from the dropdown
window.loadSelectedGist = function () {
  const selector = document.getElementById("gistSelector");
  const selectedId = selector?.value;

  if (!selectedId) {
    alert("Please select a Gist from the list.");
    return;
  }

  // Populate the Gist ID field and trigger load
  document.getElementById("gistId").value = selectedId;
  gistAction();
};

// NEW: Refresh the gist list (useful if token was just entered)
window.refreshGistList = async function () {
  const token = document.getElementById("gistToken").value;

  if (!token) {
    alert("Please enter your GitHub Personal Access Token first.");
    return;
  }

  // Persist the token
  gistManager.persistToken(token);

  await populateGistList();
};

// === PREVIEW ===

function updatePreview() {
  const data = state.get();
  const frontmatter = UI.getFrontmatterFromDOM();
  const locations = collectLocations(
    data.sections,
    data.frontmatterLocations || [],
  );

  let md = generateFrontmatter(frontmatter, locations);

  md += "## Jump to\n\n";
  data.sections.forEach((section) => {
    if (section.entries.length > 0) {
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
