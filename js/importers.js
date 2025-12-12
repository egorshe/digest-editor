import { state, updateState, saveStateToStorage, createSectionObject } from './state.js';
import { generateId, mapCSLType, formatCSLDate } from './utils.js';
import { renderSections, updatePreview } from './main.js';

export function handleZoteroImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const cslData = JSON.parse(e.target.result);
            if (!Array.isArray(cslData)) throw new Error("Invalid CSL-JSON");

            let pubSection = state.sections.find((s) => s.type === "publications");
            if (!pubSection) {
                pubSection = createSectionObject("publications");
                state.sections.unshift(pubSection);
            }

            cslData.forEach((item) => {
                const entry = {
                    id: generateId(),
                    type: "publication",
                    authors: item.author ? item.author.map(a => ({ name: a.given||"", surname: a.family||"" })) : [],
                    title: item.title || "",
                    pubType: mapCSLType(item.type),
                    containerTitle: item["container-title"] || "",
                    publisher: item.publisher || "",
                    date: formatCSLDate(item.issued),
                    url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
                    openAccess: false,
                    abstract: item.abstract || ""
                };
                pubSection.entries.push(entry);
            });

            saveStateToStorage();
            renderSections();
            updatePreview();
            alert("Imported from Zotero!");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

export function handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const newState = JSON.parse(e.target.result);
            updateState(newState);
            saveStateToStorage();
            
            // Populate Inputs
            document.getElementById("docTitle").value = state.frontmatter.title || "";
            document.getElementById("docDate").value = state.frontmatter.date || "";
            document.getElementById("docTags").value = state.frontmatter.tags || "";
            document.getElementById("docDraft").value = state.frontmatter.draft || "true";
            
            renderSections();
            updatePreview();
            alert("Draft imported!");
        } catch(err) {
            alert("Error: " + err.message);
        }
    }
    reader.readAsText(file);
    event.target.value = "";
}