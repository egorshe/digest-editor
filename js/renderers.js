// Reusable component functions
function renderInput(
  value,
  placeholder,
  sectionId,
  entryId,
  field,
  width = "w-full",
) {
  return `<input type="text" value="${value || ""}" placeholder="${placeholder}" class="${width} p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entryId}', '${field}', this.value)">`;
}

function renderTextarea(
  value,
  placeholder,
  sectionId,
  entryId,
  field,
  height = "h-24",
) {
  return `<textarea placeholder="${placeholder}" class="w-full p-2 bg-gray-600 rounded ${height} border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entryId}', '${field}', this.value)">${value || ""}</textarea>`;
}

function renderDateInput(value, sectionId, entryId, field) {
  return `<input type="date" value="${value || ""}" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entryId}', '${field}', this.value)">`;
}

function renderSelect(
  options,
  selected,
  sectionId,
  entryId,
  field,
  width = "flex-1",
) {
  let html = `<select class="${width} p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entryId}', '${field}', this.value)">`;
  options.forEach((opt) => {
    html += `<option ${selected === opt ? "selected" : ""}>${opt}</option>`;
  });
  html += `</select>`;
  return html;
}

function renderCheckbox(checked, label, sectionId, entryId, field) {
  return `<label class="flex items-center gap-2 pt-1 cursor-pointer">
    <input type="checkbox" ${checked ? "checked" : ""} onchange="updateEntry('${sectionId}', '${entryId}', '${field}', this.checked)">
    <span class="text-xs font-bold text-green-300">${label}</span>
  </label>`;
}

export function renderPublicationForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';

  // Authors Loop
  entry.authors.forEach((author, i) => {
    html += `
        <div class="flex gap-2 items-center">
            <input type="text" value="${author.surname}" placeholder="Surname" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateAuthor('${sectionId}', '${entry.id}', ${i}, 'surname', this.value)">
            <input type="text" value="${author.name}" placeholder="Name" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateAuthor('${sectionId}', '${entry.id}', ${i}, 'name', this.value)">
            ${entry.authors.length > 1 ? `<button onclick="deleteAuthor('${sectionId}', '${entry.id}', ${i})" class="text-red-400 text-xs">✕</button>` : ""}
        </div>`;
  });
  html += `<button onclick="addAuthor('${sectionId}', '${entry.id}')" class="text-blue-400 text-xs hover:text-blue-300">+ Add Author</button>`;

  // Publication Fields
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

  // Volume/Issue fields for Articles
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

  html += "</div>";
  return html;
}

export function renderJournalForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';

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

  html += "</div>";
  return html;
}

export function renderEventForm(sectionId, entry) {
  const isExhibition = entry.type === "exhibition";
  const isConference = entry.type === "conference";
  const showTheme = !isExhibition;

  let html = '<div class="space-y-2 text-sm">';

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");

  if (showTheme) {
    html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");
  }

  html += `<div class="flex gap-2">`;
  html += renderDateInput(entry.dateStart, sectionId, entry.id, "dateStart");
  html += renderDateInput(entry.dateEnd, sectionId, entry.id, "dateEnd");
  html += `</div>`;

  if (isConference) {
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

  html += "</div>";
  return html;
}

export function renderCallForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';

  html += renderInput(entry.title, "Title", sectionId, entry.id, "title");
  html += renderInput(entry.theme, "Theme", sectionId, entry.id, "theme");
  html += renderDateInput(
    entry.deadline,
    sectionId,
    entry.id,
    "deadline",
  ).replace("flex-1", "w-full");
  html += renderInput(entry.url, "URL", sectionId, entry.id, "url");

  html += "</div>";
  return html;
}

export function renderMediaForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';

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

  html += "</div>";
  return html;
}

export function renderTextForm(sectionId, entry) {
  let html = '<div class="space-y-2 text-sm">';
  html += renderTextarea(
    entry.content,
    "Content (Markdown)",
    sectionId,
    entry.id,
    "content",
    "h-32",
  );
  html += "</div>";
  return html;
}
