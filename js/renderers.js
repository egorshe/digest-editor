// Reusable component functions
function renderImportance(sectionId, entry, stage = "edit") {
  if (stage === "capture") return "";

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

function renderEditorialFields(sectionId, entry, stage = "edit") {
  if (stage === "capture") return "";

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

// FIXED: Back to value but we'll handle focus preservation differently
function renderInput(
  value,
  placeholder,
  sectionId,
  entryId,
  field,
  width = "w-full",
) {
  const escapedValue = (value || "").replace(/"/g, "&quot;");
  return `<input
    type="text"
    value="${escapedValue}"
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
  const escapedValue = (value || "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<textarea
    placeholder="${placeholder}"
    class="w-full p-2 bg-gray-600 rounded ${height} border border-transparent focus:border-blue-500 focus:outline-none"
    data-section="${sectionId}"
    data-entry="${entryId}"
    data-field="${field}"
  >${escapedValue}</textarea>`;
}

function renderDateInput(value, sectionId, entryId, field) {
  const escapedValue = (value || "").replace(/"/g, "&quot;");
  return `<input
    type="date"
    value="${escapedValue}"
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

export function renderPublicationForm(sectionId, entry, stage = "edit") {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry, stage);

  // Authors Loop
  entry.authors.forEach((author, i) => {
    const escapedSurname = (author.surname || "").replace(/"/g, "&quot;");
    const escapedName = (author.name || "").replace(/"/g, "&quot;");
    html += `
        <div class="flex gap-2 items-center">
            <input
              type="text"
              value="${escapedSurname}"
              placeholder="Surname"
              class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
              data-section="${sectionId}"
              data-entry="${entry.id}"
              data-field="author-${i}-surname"
            >
            <input
              type="text"
              value="${escapedName}"
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

  if (stage !== "capture") {
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
  }

  html += `<div class="flex gap-2">`;
  html += renderInput(
    entry.url,
    "URL/DOI",
    sectionId,
    entry.id,
    "url",
    "flex-1",
  );
  if (stage !== "capture") {
    html += renderInput(
      entry.urlText || "link",
      "Link text",
      sectionId,
      entry.id,
      "urlText",
      "w-24",
    );
  }
  html += `</div>`;

  if (stage !== "capture") {
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
  }

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}

export function renderJournalForm(sectionId, entry, stage = "edit") {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry, stage);

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

  if (stage !== "capture") {
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
  }

  html += `<div class="flex gap-2">`;
  html += renderInput(entry.url, "URL", sectionId, entry.id, "url", "flex-1");
  if (stage !== "capture") {
    html += renderInput(
      entry.urlText || "Link",
      "Link text",
      sectionId,
      entry.id,
      "urlText",
      "w-24",
    );
  }
  html += `</div>`;

  if (stage !== "capture") {
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
  }

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}

export function renderEventForm(sectionId, entry, stage = "edit") {
  const isExhibition = entry.type === "exhibition";
  const isConference = entry.type === "conference";
  const showTheme = !isExhibition;

  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry, stage);

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  if (showTheme && stage !== "capture") {
    html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");
  }

  html += `<div class="flex gap-2">`;
  html += renderDateInput(entry.dateStart, sectionId, entry.id, "dateStart");
  html += renderDateInput(entry.dateEnd, sectionId, entry.id, "dateEnd");
  html += `</div>`;

  if (isConference && stage !== "capture") {
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

  if (stage !== "capture") {
    html += renderInput(entry.venue, "Venue", sectionId, entry.id, "venue");
    html += renderInput(
      entry.coords,
      "Coordinates (lat, lng)",
      sectionId,
      entry.id,
      "coords",
    );
  }

  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  if (stage !== "capture") {
    html += renderTextarea(
      entry.description,
      "Description",
      sectionId,
      entry.id,
      "description",
      "h-20",
    );
  }

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}

export function renderCallForm(sectionId, entry, stage = "edit") {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry, stage);

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  if (stage !== "capture") {
    html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");
  }

  html += renderDateInput(
    entry.deadline,
    sectionId,
    entry.id,
    "deadline",
  ).replace("flex-1", "w-full");
  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}

export function renderMediaForm(sectionId, entry, stage = "edit") {
  let html = '<div class="space-y-2 text-sm">';

  html += renderImportance(sectionId, entry, stage);
  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  if (stage !== "capture") {
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
  }

  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  if (stage !== "capture") {
    html += renderTextarea(
      entry.description,
      "Description",
      sectionId,
      entry.id,
      "description",
      "h-20",
    );
  }

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}

export function renderTextForm(sectionId, entry, stage = "edit") {
  let html = '<div class="space-y-2 text-sm">';
  html += renderImportance(sectionId, entry, stage);

  html += renderTextarea(
    entry.content,
    "Content (Markdown)",
    sectionId,
    entry.id,
    "content",
    stage === "capture" ? "h-20" : "h-32",
  );

  html += renderEditorialFields(sectionId, entry, stage);

  html += "</div>";
  return html;
}
