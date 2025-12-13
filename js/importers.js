// js/importers.js - Enhanced import functionality
import { state } from "./state.js";
import { generateId, mapCSLType, formatCSLDate } from "./utils.js";
import { renderSections, updatePreview } from "./main.js";
import { populateFrontmatterInputs, showAlert } from "./ui.js";

export function handleZoteroImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const cslData = JSON.parse(e.target.result);
      if (!Array.isArray(cslData)) {
        throw new Error("Invalid CSL-JSON: Expected an array of items");
      }

      let pubSection = state
        .get()
        .sections.find((s) => s.type === "publications");
      if (!pubSection) {
        pubSection = state.addSection("publications");
      }

      let importCount = 0;
      cslData.forEach((item) => {
        const entry = {
          id: generateId(),
          type: "publication",
          authors: item.author
            ? item.author.map((a) => ({
                name: a.given || "",
                surname: a.family || "",
              }))
            : [{ name: "", surname: "" }],
          title: item.title || "",
          pubType: mapCSLType(item.type),
          containerTitle: item["container-title"] || "",
          publisher: item.publisher || "",
          date: formatCSLDate(item.issued),
          url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
          urlText: "link",
          openAccess: false,
          abstract: item.abstract || "",
        };
        pubSection.entries.push(entry);
        importCount++;
      });

      state.save();
      renderSections();
      updatePreview();
      showAlert(`Successfully imported ${importCount} items from Zotero!`);
    } catch (err) {
      console.error("Zotero import error:", err);
      showAlert(`Error importing Zotero data: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

export function handleJSONImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const newState = JSON.parse(e.target.result);

      // Validate basic structure
      if (!newState.frontmatter || !newState.sections) {
        throw new Error("Invalid digest file structure");
      }

      state.update(newState);
      populateFrontmatterInputs();
      renderSections();
      updatePreview();
      showAlert("Draft imported successfully!");
    } catch (err) {
      console.error("JSON import error:", err);
      showAlert(`Error importing draft: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}
