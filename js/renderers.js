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

  // Pub Fields
  html += `
    <input type="text" value="${entry.title || ""}" placeholder="Title" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'title', this.value)">
    <div class="flex gap-2">
        <select class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entry.id}', 'pubType', this.value)">
            <option ${entry.pubType === "Book" ? "selected" : ""}>Book</option>
            <option ${entry.pubType === "Article" ? "selected" : ""}>Article</option>
            <option ${entry.pubType === "Chapter" ? "selected" : ""}>Chapter</option>
            <option ${entry.pubType === "Thesis" ? "selected" : ""}>Thesis</option>
            <option ${entry.pubType === "Online Article" ? "selected" : ""}>Online Article</option>
        </select>
        <input type="text" value="${entry.date || ""}" placeholder="Date" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'date', this.value)">
    </div>
    <input type="text" value="${entry.containerTitle || ""}" placeholder="${entry.pubType === "Article" || entry.pubType === "Online Article" ? "Journal Title" : "Container Title"}" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'containerTitle', this.value)">`;

  // FIXED: Add Volume/Issue fields for Articles
  if (entry.pubType === "Article" || entry.pubType === "Online Article") {
    html += `
    <div class="flex gap-2">
        <input type="text" value="${entry.volume || ""}" placeholder="Volume" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'volume', this.value)">
        <input type="text" value="${entry.issue || ""}" placeholder="Issue" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'issue', this.value)">
    </div>`;
  }

  html += `
    <input type="text" value="${entry.publisher || ""}" placeholder="Publisher" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'publisher', this.value)">

    <div class="flex gap-2">
        <input type="text" value="${entry.url || ""}" placeholder="URL/DOI" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'url', this.value)">
        <input type="text" value="${entry.urlText || "link"}" placeholder="Link text" class="w-24 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'urlText', this.value)">
    </div>

    <label class="flex items-center gap-2 pt-1 cursor-pointer">
        <input type="checkbox" ${entry.openAccess ? "checked" : ""} onchange="updateEntry('${sectionId}', '${entry.id}', 'openAccess', this.checked)">
        <span class="text-xs font-bold text-green-300">Open Access</span>
    </label>

    <textarea placeholder="Abstract" class="w-full p-2 bg-gray-600 rounded h-24 border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'abstract', this.value)">${entry.abstract || ""}</textarea>
    </div>`;
  return html;
}

export function renderJournalForm(sectionId, entry) {
  return `
    <div class="space-y-2 text-sm">
        <input type="text" value="${entry.journalName || ""}" placeholder="Journal Name" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'journalName', this.value)">

        <div class="grid grid-cols-3 gap-2">
            <input type="text" value="${entry.volume || ""}" placeholder="Vol" class="p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'volume', this.value)">
            <input type="text" value="${entry.issue || ""}" placeholder="Issue" class="p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'issue', this.value)">
            <input type="text" value="${entry.date || ""}" placeholder="Date" class="p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'date', this.value)">
        </div>

        <input type="text" value="${entry.theme || ""}" placeholder="Theme / Special Issue Title" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'theme', this.value)">

        <input type="text" value="${entry.guestEditor || ""}" placeholder="Guest Editor(s)" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'guestEditor', this.value)">

        <div class="flex gap-2">
            <input type="text" value="${entry.url || ""}" placeholder="URL" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'url', this.value)">
            <input type="text" value="${entry.urlText || "Link"}" placeholder="Link text" class="w-24 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'urlText', this.value)">
        </div>

        <label class="flex items-center gap-2 pt-1 cursor-pointer">
            <input type="checkbox" ${entry.openAccess ? "checked" : ""} onchange="updateEntry('${sectionId}', '${entry.id}', 'openAccess', this.checked)">
            <span class="text-xs font-bold text-green-300">Open Access</span>
        </label>

        <textarea placeholder="Description" class="w-full p-2 bg-gray-600 rounded h-24 border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'description', this.value)">${entry.description || ""}</textarea>
    </div>
    `;
}

export function renderEventForm(sectionId, entry) {
  const isExhibition = entry.type === "exhibition";
  const showTheme = !isExhibition;
  let html = `<div class="space-y-2 text-sm">
        <input type="text" value="${entry.title || ""}" placeholder="Title" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'title', this.value)">`;

  if (showTheme)
    html += `<input type="text" value="${entry.theme || ""}" placeholder="Theme" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'theme', this.value)">`;

  html += `<div class="flex gap-2">
        <input type="date" value="${entry.dateStart || ""}" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entry.id}', 'dateStart', this.value)">
        <input type="date" value="${entry.dateEnd || ""}" class="flex-1 p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entry.id}', 'dateEnd', this.value)">
    </div>
    <input type="text" value="${entry.place || ""}" placeholder="City, Country" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'place', this.value)">
    <input type="text" value="${entry.venue || ""}" placeholder="Venue" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'venue', this.value)">
    <input type="text" value="${entry.url || ""}" placeholder="URL" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'url', this.value)">
    <textarea placeholder="Description" class="w-full p-2 bg-gray-600 rounded h-20 border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'description', this.value)">${entry.description || ""}</textarea>
    </div>`;
  return html;
}

export function renderCallForm(sectionId, entry) {
  return `<div class="space-y-2 text-sm">
      <input type="text" value="${entry.title || ""}" placeholder="Title" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'title', this.value)">
      <input type="text" value="${entry.theme || ""}" placeholder="Theme" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'theme', this.value)">
      <input type="date" value="${entry.deadline || ""}" placeholder="Deadline" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entry.id}', 'deadline', this.value)">
      <input type="text" value="${entry.url || ""}" placeholder="URL" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'url', this.value)">
    </div>`;
}

export function renderMediaForm(sectionId, entry) {
  return `<div class="space-y-2 text-sm">
      <input type="text" value="${entry.title || ""}" placeholder="Title" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'title', this.value)">
      <select class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onchange="updateEntry('${sectionId}', '${entry.id}', 'mediaType', this.value)">
        <option ${entry.mediaType === "Video" ? "selected" : ""}>Video</option>
        <option ${entry.mediaType === "Podcast" ? "selected" : ""}>Podcast</option>
        <option ${entry.mediaType === "Audio" ? "selected" : ""}>Audio</option>
      </select>
      <input type="text" value="${entry.creator || ""}" placeholder="Creator/Host" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'creator', this.value)">
      <input type="text" value="${entry.url || ""}" placeholder="URL" class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'url', this.value)">
      <textarea placeholder="Description" class="w-full p-2 bg-gray-600 rounded h-20 border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'description', this.value)">${entry.description || ""}</textarea>
    </div>`;
}

export function renderTextForm(sectionId, entry) {
  return `<div class="space-y-2 text-sm">
      <textarea placeholder="Content (Markdown)" class="w-full p-2 bg-gray-600 rounded h-32 border border-transparent focus:border-blue-500 focus:outline-none" onblur="updateEntry('${sectionId}', '${entry.id}', 'content', this.value)">${entry.content || ""}</textarea>
    </div>`;
}
