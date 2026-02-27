import { state } from "./state.js";
import { sectionTypes } from "./config.js";
import { dragDropManager } from "./io.js";

// === SMALL RENDER HELPERS (return strings) ===

function renderImportance(sectionId, entry) {
  return `
    <div class="flex items-center gap-2 text-xs">
      <span class="text-gray-400">Importance</span>
      <div class="flex gap-1">
        ${[1, 2, 3]
          .map(
            (lvl) => `
          <button
            type="button"
            class="px-2 py-1 rounded ${
              (entry.importance ?? 2) === lvl
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }"
            onclick="updateEntry('${sectionId}', '${entry.id}', 'importance', ${lvl})"
            title="${lvl === 3 ? "Major" : lvl === 2 ? "Normal" : "Minor"}"
          >
            ${lvl}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderEditorialFields(sectionId, entry) {
  return `
    <div class="space-y-2 pt-2 border-t border-gray-600">
      <div class="flex items-center gap-2 text-xs text-amber-400">
        <span>✎</span>
        <span class="font-semibold">Editorial Context</span>
      </div>
      ${renderTextarea(
        entry.whyItMatters,
        "Why it matters (1 sentence – optional but encouraged)",
        sectionId,
        entry.id,
        "whyItMatters",
        "h-16",
      )}
      ${renderSelect(
        [
          "",
          "institutional",
          "methodological",
          "funding",
          "event",
          "debate",
          "resource",
        ],
        entry.signal || "",
        sectionId,
        entry.id,
        "signal",
        "w-full",
      ).replace("<select", '<select title="Signal tag (optional)"')}
    </div>
  `;
}

function renderInput(
  value,
  placeholder,
  sectionId,
  entryId,
  field,
  width = "w-full",
) {
  return `<input
    type="text"
    value="${escapeHtml(value || "")}"
    placeholder="${placeholder}"
    class="${width} p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
    data-section="${sectionId}"
    data-entry="${entryId}"
    data-field="${field}"
  >`;
}

function renderTextarea(
  value,
  placeholder,
  sectionId,
  entryId,
  field,
  height = "h-24",
) {
  return `<textarea
    placeholder="${placeholder}"
    class="w-full p-2 bg-gray-600 rounded ${height} border border-transparent focus:border-blue-500 focus:outline-none"
    data-section="${sectionId}"
    data-entry="${entryId}"
    data-field="${field}"
  >${escapeHtml(value || "")}</textarea>`;
}

function renderDateInput(value, sectionId, entryId, field) {
  return `<input
    type="date"
    value="${escapeHtml(value || "")}"
    class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
    data-section="${sectionId}"
    data-entry="${entryId}"
    data-field="${field}"
  >`;
}

function renderSelect(
  options,
  selected,
  sectionId,
  entryId,
  field,
  width = "flex-1",
) {
  let html = `<select
    class="${width} p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
    data-section="${sectionId}"
    data-entry="${entryId}"
    data-field="${field}"
  >`;
  options.forEach((opt) => {
    html += `<option ${selected === opt ? "selected" : ""}>${opt}</option>`;
  });
  html += `</select>`;
  return html;
}

function renderCheckbox(checked, label, sectionId, entryId, field) {
  return `<label class="flex items-center gap-2 pt-1 cursor-pointer">
    <input
      type="checkbox"
      ${checked ? "checked" : ""}
      data-section="${sectionId}"
      data-entry="${entryId}"
      data-field="${field}"
    >
    <span class="text-xs font-bold text-green-300">${label}</span>
  </label>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// === ENTRY FORM RENDERERS ===

export function renderPublicationForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry);

  entry.authors.forEach((author, i) => {
    html += `
        <div class="flex gap-2 items-center">
            <input
              type="text"
              value="${escapeHtml(author.surname || "")}"
              placeholder="Surname"
              class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
              data-section="${sectionId}"
              data-entry="${entry.id}"
              data-field="author-${i}-surname"
            >
            <input
              type="text"
              value="${escapeHtml(author.name || "")}"
              placeholder="Name"
              class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
              data-section="${sectionId}"
              data-entry="${entry.id}"
              data-field="author-${i}-name"
            >
            ${entry.authors.length > 1 ? `<button onclick="deleteAuthor('${sectionId}', '${entry.id}', ${i})" class="text-red-400 text-xs">✕</button>` : ""}
        </div>`;
  });
  html += `<button onclick="addAuthor('${sectionId}', '${entry.id}')" class="text-blue-400 text-xs hover:text-blue-300">+ Add Author</button>`;

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  html += `<div class="flex gap-2">`;
  html += renderSelect(
    ["Book", "Article", "Chapter", "Thesis", "Online Article"],
    entry.pubType,
    sectionId,
    entry.id,
    "pubType",
  );
  html += renderInput(
    entry.date,
    "Date",
    sectionId,
    entry.id,
    "date",
    "flex-1",
  );
  html += `</div>`;

  const containerPlaceholder =
    entry.pubType === "Article" || entry.pubType === "Online Article"
      ? "Journal Title"
      : "Container Title";
  html += renderInput(
    entry.containerTitle,
    containerPlaceholder,
    sectionId,
    entry.id,
    "containerTitle",
  );

  if (entry.pubType === "Article" || entry.pubType === "Online Article") {
    html += `<div class="flex gap-2">`;
    html += renderInput(
      entry.volume,
      "Volume",
      sectionId,
      entry.id,
      "volume",
      "flex-1",
    );
    html += renderInput(
      entry.issue,
      "Issue",
      sectionId,
      entry.id,
      "issue",
      "flex-1",
    );
    html += `</div>`;
  }

  html += renderInput(
    entry.publisher,
    "Publisher",
    sectionId,
    entry.id,
    "publisher",
  );

  html += `<div class="flex gap-2">`;
  html += renderInput(
    entry.url,
    "URL/DOI",
    sectionId,
    entry.id,
    "url",
    "flex-1",
  );
  html += renderInput(
    entry.urlText || "link",
    "Link text",
    sectionId,
    entry.id,
    "urlText",
    "w-24",
  );
  html += `</div>`;

  html += renderCheckbox(
    entry.openAccess,
    "Open Access",
    sectionId,
    entry.id,
    "openAccess",
  );
  html += renderTextarea(
    entry.abstract,
    "Abstract",
    sectionId,
    entry.id,
    "abstract",
  );

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

export function renderJournalForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry);

  html += renderInput(
    entry.journalName,
    "Journal Name",
    sectionId,
    entry.id,
    "journalName",
  );

  html += `<div class="grid grid-cols-3 gap-2">`;
  html += renderInput(
    entry.volume,
    "Vol",
    sectionId,
    entry.id,
    "volume",
    "w-full",
  );
  html += renderInput(
    entry.issue,
    "Issue",
    sectionId,
    entry.id,
    "issue",
    "w-full",
  );
  html += renderInput(
    entry.date,
    "Date",
    sectionId,
    entry.id,
    "date",
    "w-full",
  );
  html += `</div>`;

  html += renderInput(
    entry.theme,
    "Theme / Special Issue Title",
    sectionId,
    entry.id,
    "theme",
  );
  html += renderInput(
    entry.guestEditor,
    "Guest Editor(s)",
    sectionId,
    entry.id,
    "guestEditor",
  );

  html += `<div class="flex gap-2">`;
  html += renderInput(entry.url, "URL", sectionId, entry.id, "url", "flex-1");
  html += renderInput(
    entry.urlText || "Link",
    "Link text",
    sectionId,
    entry.id,
    "urlText",
    "w-24",
  );
  html += `</div>`;

  html += renderCheckbox(
    entry.openAccess,
    "Open Access",
    sectionId,
    entry.id,
    "openAccess",
  );
  html += renderTextarea(
    entry.description,
    "Description",
    sectionId,
    entry.id,
    "description",
  );

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

export function renderEventForm(sectionId, entry) {
  const isExhibition = entry.type === "exhibition";
  const showTheme = !isExhibition;

  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry);

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  // Custom Event Type field
  html += `<div class="flex gap-2">`;
  html += renderSelect(
    ["Conference", "Festival", "Exhibition", "Custom"],
    entry.customEventType
      ? "Custom"
      : entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
    sectionId,
    entry.id,
    "eventTypeSelector",
    "flex-1",
  ).replace("<select", '<select title="Event Type"');

  html += `<input
    type="text"
    value="${escapeHtml(entry.customEventType || "")}"
    placeholder="Custom type (e.g., Workshop, Symposium)"
    class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none ${entry.customEventType ? "" : "hidden"}"
    data-section="${sectionId}"
    data-entry="${entry.id}"
    data-field="customEventType"
    id="customEventType_${entry.id}"
  >`;
  html += `</div>`;

  if (showTheme) {
    html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");
  }

  html += `<div class="flex gap-2">`;
  html += renderDateInput(entry.dateStart, sectionId, entry.id, "dateStart");
  html += renderDateInput(entry.dateEnd, sectionId, entry.id, "dateEnd");
  html += `</div>`;

  if (entry.type === "conference") {
    html += renderDateInput(
      entry.cfpDeadline,
      sectionId,
      entry.id,
      "cfpDeadline",
    ).replace("flex-1", "w-full");
  }

  html += renderInput(
    entry.place,
    "City, Country",
    sectionId,
    entry.id,
    "place",
  );

  html += renderInput(entry.venue, "Venue", sectionId, entry.id, "venue");
  html += renderInput(
    entry.coords,
    "Coordinates (lat, lng)",
    sectionId,
    entry.id,
    "coords",
  );

  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  html += renderTextarea(
    entry.description,
    "Description",
    sectionId,
    entry.id,
    "description",
    "h-20",
  );

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

export function renderCallForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry);

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");
  html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");

  html += renderDateInput(
    entry.deadline,
    sectionId,
    entry.id,
    "deadline",
  ).replace("flex-1", "w-full");
  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

export function renderMediaForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';

  html += renderImportance(sectionId, entry);
  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  html += renderSelect(
    ["Video", "Podcast", "Audio"],
    entry.mediaType,
    sectionId,
    entry.id,
    "mediaType",
    "w-full",
  );
  html += renderInput(
    entry.creator,
    "Creator/Host",
    sectionId,
    entry.id,
    "creator",
  );

  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  html += renderTextarea(
    entry.description,
    "Description",
    sectionId,
    entry.id,
    "description",
    "h-20",
  );

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

export function renderTextForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry);

  html += renderTextarea(
    entry.content,
    "Content (Markdown)",
    sectionId,
    entry.id,
    "content",
    "h-32",
  );

  html += renderEditorialFields(sectionId, entry);

  html += "</div>";
  return html;
}

// === DOM MANIPULATION ===

export function renderSections() {
  const container = document.getElementById("sectionsContainer");
  const scrollTop = container.scrollTop;

  container.innerHTML = "";

  state.get().sections.forEach((section) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className =
      "mb-6 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700";
    sectionDiv.draggable = false; // Section itself not draggable - only the handle is
    sectionDiv.dataset.sectionId = section.id;

    let html = `
      <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-3">
                <div class="flex flex-col">
                  <button onclick="moveSectionUp('${section.id}')" class="text-gray-400 hover:text-white leading-none text-xs" title="Move Up">▲</button>
                  <button onclick="moveSectionDown('${section.id}')" class="text-gray-400 hover:text-white leading-none text-xs" title="Move Down">▼</button>
                </div>
                <h3 class="text-lg font-bold text-blue-300">
                  ${section.title}
                </h3>
              </div>
        <button onclick="deleteSection('${section.id}')" class="text-red-400 hover:text-red-300 text-sm font-semibold hover:bg-red-900/30 px-2 py-1 rounded">Delete</button>
      </div>
    `;

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

    // Add button at the end
    const entryConfig = getEntryConfig(section.type);
    html += `<button onclick="addEntry('${section.id}', '${entryConfig.type}')" class="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add ${entryConfig.text}</button>`;

    sectionDiv.innerHTML = html;
    container.appendChild(sectionDiv);

    // Attach entry drag handle listeners
    sectionDiv.querySelectorAll("[data-entry-id]").forEach((entryDiv) => {
      const dragHandle = entryDiv.querySelector(".entry-drag-handle");
      if (dragHandle) {
        dragDropManager.attachEntryListeners(entryDiv, dragHandle);
      }
    });
  });

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
  if (entry.type === "publication") {
    return renderPublicationForm(sectionId, entry);
  } else if (entry.type === "journalIssue") {
    return renderJournalForm(sectionId, entry);
  } else if (["conference", "exhibition", "festival"].includes(entry.type)) {
    return renderEventForm(sectionId, entry);
  } else if (entry.type === "callForPapers") {
    return renderCallForm(sectionId, entry);
  } else if (entry.type === "media") {
    return renderMediaForm(sectionId, entry);
  } else {
    return renderTextForm(sectionId, entry);
  }
}

export function renderAddSectionMenu() {
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

export function populateFrontmatterInputs(frontmatter) {
  document.getElementById("docTitle").value = frontmatter.title || "";
  document.getElementById("docDate").value = frontmatter.date || "";

  if (Array.isArray(frontmatter.tags)) {
    document.getElementById("docTags").value = frontmatter.tags.join(", ");
  } else {
    document.getElementById("docTags").value = frontmatter.tags || "";
  }

  document.getElementById("docDraft").value =
    frontmatter.draft !== undefined ? String(frontmatter.draft) : "true";
}

export function getFrontmatterFromDOM() {
  return {
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

// === HELPERS ===
export function showConfirmDialog(message) {
  return confirm(message);
}

export function showPromptDialog(message) {
  return prompt(message);
}

export function showAlert(message) {
  alert(message);
}
