import { state } from "./state.js";
import { gistManager } from "./gist.js";
import { renderSections, updatePreview } from "./main.js";

let currentGistAction = "";

export function openGistModal(action) {
  currentGistAction = action;
  const modal = document.getElementById("gistModal");
  const title = document.getElementById("gistModalTitle");
  const button = document.getElementById("gistActionButton");

  // FIXED: Load from localStorage instead of sessionStorage
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
}

export function closeGistModal() {
  document.getElementById("gistModal").style.display = "none";
}

export async function performGistAction() {
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

      state.update(loadedState);

      // Re-populate Frontmatter inputs
      document.getElementById("docTitle").value =
        state.get().frontmatter.title || "";
      document.getElementById("docDate").value =
        state.get().frontmatter.date || "";
      document.getElementById("docTags").value =
        state.get().frontmatter.tags || "";
      document.getElementById("docDraft").value =
        state.get().frontmatter.draft || "true";

      renderSections();
      updatePreview();
      alert("Draft loaded successfully from Gist!");
    }
  } catch (error) {
    alert(error.message);
  } finally {
    actionButton.disabled = false;
    actionButton.textContent = "Perform Action";
    closeGistModal();
  }
}

export function showConfirmDialog(message) {
  return confirm(message);
}

export function showPromptDialog(message) {
  return prompt(message);
}

export function showAlert(message) {
  alert(message);
}

export function populateFrontmatterInputs() {
  const data = state.get();
  document.getElementById("docTitle").value = data.frontmatter.title || "";
  document.getElementById("docDate").value = data.frontmatter.date || "";
  document.getElementById("docTags").value = data.frontmatter.tags || "";
  document.getElementById("docDraft").value = data.frontmatter.draft || "true";
}

export function toggleLocationsEditor() {
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
}

export function renderLocationsEditor() {
  const container = document.getElementById("locationsEditorContainer");
  const data = state.get();

  // Collect all events with their section/entry IDs for syncing
  const eventLocations = [];
  data.sections.forEach((section) => {
    section.entries.forEach((entry) => {
      if (["conference", "exhibition", "festival"].includes(entry.type)) {
        eventLocations.push({
          sectionId: section.id,
          entryId: entry.id,
          type: entry.type,
          entry: entry,
        });
      }
    });
  });

  if (eventLocations.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 text-sm">No events found. Add conferences, festivals, or exhibitions to edit their location data.</p>';
    return;
  }

  container.innerHTML = eventLocations
    .map((loc, idx) => {
      const eventTypeLabel = getEventTypeLabel(loc.entry);
      const { city, country } = parsePlaceField(loc.entry.place);
      const dateValue = formatEventDate(loc.entry.dateStart, loc.entry.dateEnd);

      return `
      <div class="p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="col-span-2">
          <label class="block text-xs text-gray-400 mb-1">Event Type</label>
          <input type="text" value="${loc.entry.customEventType || loc.type}"
                 list="eventTypesList"
                 class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                 onblur="updateLocationEventType('${loc.sectionId}', '${loc.entryId}', this.value)">
          <datalist id="eventTypesList">
            <option value="conference">
            <option value="festival">
            <option value="exhibition">
            <option value="summer school">
            <option value="workshop">
          </datalist>
        </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">Title</label>
            <input type="text" value="${loc.entry.title || ""}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   onblur="updateEntry('${loc.sectionId}', '${loc.entryId}', 'title', this.value)">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">City</label>
            <input type="text" value="${city}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   onblur="updateLocationCity('${loc.sectionId}', '${loc.entryId}', this.value)">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Country</label>
            <input type="text" value="${country}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   onblur="updateLocationCountry('${loc.sectionId}', '${loc.entryId}', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">Venue</label>
            <input type="text" value="${loc.entry.venue || ""}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   onblur="updateEntry('${loc.sectionId}', '${loc.entryId}', 'venue', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">Coordinates (lat, lng)</label>
            <input type="text" value="${loc.entry.coords || ""}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   placeholder="e.g., 52.5200, 13.4050"
                   onblur="updateEntry('${loc.sectionId}', '${loc.entryId}', 'coords', this.value)">
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">Date/Date Range</label>
            <input type="text" value="${dateValue}"
                   class="w-full p-2 bg-gray-600 rounded border border-transparent focus:border-blue-500 focus:outline-none"
                   readonly disabled
                   title="Edit dates in the event entry below">
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-400 mb-1">Description</label>
            <textarea class="w-full p-2 bg-gray-600 rounded h-20 border border-transparent focus:border-blue-500 focus:outline-none"
                      onblur="updateEntry('${loc.sectionId}', '${loc.entryId}', 'description', this.value)">${loc.entry.description || ""}</textarea>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// Helper functions for locations editor
function getEventTypeLabel(type) {
  const labels = {
    conference: "Conference",
    festival: "Festival",
    exhibition: "Exhibition",
  };
  return labels[type] || "Event";
}

function parsePlaceField(place) {
  if (!place) return { city: "", country: "" };
  const parts = place.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  } else if (parts.length === 1) {
    return { city: parts[0], country: "" };
  }
  return { city: "", country: "" };
}

function formatEventDate(dateStart, dateEnd) {
  if (!dateStart) return "";
  if (!dateEnd || dateStart === dateEnd) return dateStart;
  return `${dateStart} to ${dateEnd}`;
}
