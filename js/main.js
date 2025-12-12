import { state, initDefaults, saveStateToStorage, loadStateFromStorage, createSectionObject, updateState } from './state.js';
import { generateId } from './utils.js';
import { sectionTypes } from './config.js';
import * as Renderers from './renderers.js';
import * as Generators from './generators.js';
import * as Importers from './importers.js';

// --- INITIALIZATION ---
window.onload = function() {
    loadStateFromStorage();
    if (state.sections.length === 0) {
        initDefaults();
    }
    
    // Restore frontmatter input values
    document.getElementById("docTitle").value = state.frontmatter.title || "";
    document.getElementById("docDate").value = state.frontmatter.date || "";
    document.getElementById("docTags").value = state.frontmatter.tags || "";
    document.getElementById("docDraft").value = state.frontmatter.draft || "true";

    renderSections();
    renderAddSectionMenu();
    updatePreview();
};

// --- GLOBAL EXPORTS FOR HTML ONCLICK ---
window.saveState = function() {
    saveStateToStorage();
    updatePreview();
};

window.resetState = function() {
    if(confirm("Delete everything?")) {
        localStorage.removeItem("digestState");
        updateState({ frontmatter: {}, sections: [] });
        document.getElementById("docTitle").value = "";
        document.getElementById("docDate").value = "";
        document.getElementById("docTags").value = "";
        initDefaults();
        renderSections();
        updatePreview();
    }
};

window.addSection = function(type) {
    const section = createSectionObject(type);
    state.sections.push(section);
    saveStateToStorage();
    renderSections();
    updatePreview();
};

window.addCustomSection = function() {
    const title = prompt("Section title:");
    if (title) {
        state.sections.push(createSectionObject("custom", title));
        saveStateToStorage();
        renderSections();
    }
};

window.deleteSection = function(id) {
    if(confirm("Delete section?")) {
        state.sections = state.sections.filter(s => s.id !== id);
        saveStateToStorage();
        renderSections();
        updatePreview();
    }
};

window.addEntry = function(sectionId, type) {
    const section = state.sections.find(s => s.id === sectionId);
    const entry = { id: generateId(), type: type };
    
    // Initialize defaults based on type
    if(type === 'publication') {
        entry.authors = [{name:"", surname:""}];
        entry.pubType = "Article";
    } else if (type === 'journalIssue') {
        entry.journalName = "";
        entry.volume = "";
        entry.issue = "";
        entry.date = "";
        entry.theme = "";
        entry.guestEditor = "";
        entry.urlText = "Link";
        entry.openAccess = false;
    }
    
    section.entries.push(entry);
    saveStateToStorage();
    renderSections();
};

window.deleteEntry = function(sectionId, entryId) {
    const section = state.sections.find(s => s.id === sectionId);
    section.entries = section.entries.filter(e => e.id !== entryId);
    saveStateToStorage();
    renderSections();
    updatePreview();
};

window.updateEntry = function(sectionId, entryId, field, value) {
    const section = state.sections.find(s => s.id === sectionId);
    const entry = section.entries.find(e => e.id === entryId);
    entry[field] = value;
    saveStateToStorage();
    updatePreview();
};

// Author specifics
window.addAuthor = function(sectionId, entryId) {
    const section = state.sections.find(s => s.id === sectionId);
    const entry = section.entries.find(e => e.id === entryId);
    entry.authors.push({name:"", surname:""});
    saveStateToStorage();
    renderSections();
};

window.updateAuthor = function(sectionId, entryId, idx, field, value) {
    const section = state.sections.find(s => s.id === sectionId);
    const entry = section.entries.find(e => e.id === entryId);
    entry.authors[idx][field] = value;
    saveStateToStorage();
    updatePreview();
};

window.deleteAuthor = function(sectionId, entryId, idx) {
    const section = state.sections.find(s => s.id === sectionId);
    const entry = section.entries.find(e => e.id === entryId);
    entry.authors.splice(idx, 1);
    saveStateToStorage();
    renderSections();
};

// Import/Export
window.exportJSON = function() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "digest-draft.json";
    a.click();
};

window.importJSON = () => document.getElementById("jsonInput").click();
window.handleJSONImport = Importers.handleJSONImport;

window.importZotero = () => document.getElementById("zoteroInput").click();
window.handleZoteroImport = Importers.handleZoteroImport;

window.downloadMarkdown = function() {
    const md = document.getElementById("preview").textContent;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "digest.md";
    a.click();
};


// --- CORE RENDERING LOGIC ---
export function renderSections() {
    const container = document.getElementById("sectionsContainer");
    container.innerHTML = "";

    state.sections.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "mb-6 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700";
        sectionDiv.draggable = true;
        sectionDiv.dataset.sectionId = section.id;
        
        // Drag Events
        sectionDiv.addEventListener("dragstart", handleSectionDragStart);
        sectionDiv.addEventListener("dragover", handleDragOver);
        sectionDiv.addEventListener("drop", handleSectionDrop);
        sectionDiv.addEventListener("dragend", handleDragEnd);

        let html = `
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-blue-300 cursor-move flex items-center gap-2">
              <span class="text-gray-500 hover:text-white">☰</span> ${section.title}
            </h3>
            <button onclick="deleteSection('${section.id}')" class="text-red-400 hover:text-red-300 text-sm font-semibold hover:bg-red-900/30 px-2 py-1 rounded">Delete</button>
          </div>
        `;

        // Type-specific "Add" buttons
        if (section.type === "publications") {
            html += `<button onclick="addEntry('${section.id}', 'publication')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Publication</button>`;
        } else if (section.type === "journalIssues") {
            html += `<button onclick="addEntry('${section.id}', 'journalIssue')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Journal Issue</button>`;
        } else if (section.type === "conferences") {
            html += `<button onclick="addEntry('${section.id}', 'conference')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Conference</button>`;
        } else if (section.type === "callForPapers") {
            html += `<button onclick="addEntry('${section.id}', 'callForPapers')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Call</button>`;
        } else if (section.type === "festivals") {
            html += `<button onclick="addEntry('${section.id}', 'festival')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Festival</button>`;
        } else if (section.type === "exhibitions") {
            html += `<button onclick="addEntry('${section.id}', 'exhibition')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Exhibition</button>`;
        } else if (section.type === "media") {
            html += `<button onclick="addEntry('${section.id}', 'media')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Media</button>`;
        } else {
            html += `<button onclick="addEntry('${section.id}', 'text')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add Entry</button>`;
        }

        html += '<div class="space-y-4">';
        
        // Entries
        section.entries.forEach((entry, idx) => {
            html += `<div class="p-3 bg-gray-750 bg-gray-700/50 rounded border border-gray-600 cursor-move hover:border-gray-500 transition" draggable="true" data-entry-id="${entry.id}" data-section-id="${section.id}">`;
            html += `<div class="flex justify-between items-center mb-2"><span class="text-xs text-gray-400 font-mono">:: Entry ${idx + 1}</span><button onclick="deleteEntry('${section.id}', '${entry.id}')" class="text-red-400 hover:text-red-300 text-xs">✕</button></div>`;
            
            if (entry.type === "publication") {
                html += Renderers.renderPublicationForm(section.id, entry);
            } else if (entry.type === "journalIssue") {
                html += Renderers.renderJournalForm(section.id, entry); // New Renderer
            } else if (entry.type === "conference" || entry.type === "exhibition" || entry.type === "festival") {
                html += Renderers.renderEventForm(section.id, entry);
            } else if (entry.type === "callForPapers") {
                html += Renderers.renderCallForm(section.id, entry);
            } else if (entry.type === "media") {
                html += Renderers.renderMediaForm(section.id, entry);
            } else {
                html += Renderers.renderTextForm(section.id, entry);
            }
            html += "</div>";
        });
        html += "</div>";

        sectionDiv.innerHTML = html;
        container.appendChild(sectionDiv);
        
        // Entry Drag Listeners
        sectionDiv.querySelectorAll("[data-entry-id]").forEach(el => {
            el.addEventListener("dragstart", handleEntryDragStart);
            el.addEventListener("dragover", handleDragOver);
            el.addEventListener("drop", handleEntryDrop);
            el.addEventListener("dragend", handleDragEnd);
        });
    });
}

function renderAddSectionMenu() {
    const container = document.getElementById("addSectionMenuContainer");
    container.innerHTML = `
    <div class="mb-6 p-4 bg-gray-800 rounded-lg border border-dashed border-gray-600">
      <h3 class="text-lg font-bold mb-3 text-blue-300">Add Standard Section</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        ${Object.entries(sectionTypes)
            .filter(([key]) => key !== "custom")
            .map(([key, val]) => `<button onclick="addSection('${key}')" class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition">${val.icon} ${val.title}</button>`)
            .join("")}
      </div>
    </div>`;
}

export function updatePreview() {
    let md = "---\n";
    md += `layout: digest-entry\n`;
    md += `title: "${state.frontmatter.title || "Untitled"}"\n`;
    md += `date: ${state.frontmatter.date || "2025-01-01"}\n`;
    md += `tags: [${state.frontmatter.tags || ""}]\n`;
    md += `draft: ${state.frontmatter.draft || "true"}\n`;
    md += "---\n\n";

    state.sections.forEach(section => {
        if(section.entries.length === 0) return;
        md += `## ${section.title}\n\n`;
        section.entries.forEach(entry => {
            if (entry.type === "publication") md += Generators.generatePublicationMarkdown(entry);
            else if (entry.type === "journalIssue") md += Generators.generateJournalMarkdown(entry); // New Generator
            else if (entry.type === "conference" || entry.type === "exhibition" || entry.type === "festival") md += Generators.generateEventMarkdown(entry);
            else if (entry.type === "callForPapers") md += Generators.generateCallMarkdown(entry);
            else if (entry.type === "media") md += Generators.generateMediaMarkdown(entry);
            else md += `${entry.content || ""}\n\n`;
        });
    });
    
    document.getElementById("preview").textContent = md;
}

// --- DRAG AND DROP HANDLERS ---
let draggedSection = null;
let draggedEntry = null;

function handleSectionDragStart(e) { draggedSection = this; this.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; }
function handleEntryDragStart(e) { draggedEntry = this; this.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.stopPropagation(); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; this.classList.add("drag-over"); }
function handleDragEnd(e) { 
    if(draggedSection) draggedSection.classList.remove("dragging"); 
    if(draggedEntry) draggedEntry.classList.remove("dragging"); 
    document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over")); 
    draggedSection = null; draggedEntry = null;
}

function handleSectionDrop(e) {
    e.stopPropagation(); e.preventDefault();
    if(draggedSection && this.dataset.sectionId) {
        const fromIdx = state.sections.findIndex(s => s.id === draggedSection.dataset.sectionId);
        const toIdx = state.sections.findIndex(s => s.id === this.dataset.sectionId);
        const [removed] = state.sections.splice(fromIdx, 1);
        state.sections.splice(toIdx, 0, removed);
        saveStateToStorage(); renderSections(); updatePreview();
    }
    this.classList.remove("drag-over");
}

function handleEntryDrop(e) {
    e.stopPropagation(); e.preventDefault();
    if(draggedEntry && this.dataset.entryId) {
        const fromSec = state.sections.find(s => s.id === draggedEntry.dataset.sectionId);
        const toSec = state.sections.find(s => s.id === this.dataset.sectionId);
        const fromEntryIdx = fromSec.entries.findIndex(e => e.id === draggedEntry.dataset.entryId);
        const toEntryIdx = toSec.entries.findIndex(e => e.id === this.dataset.entryId);
        
        const [movedEntry] = fromSec.entries.splice(fromEntryIdx, 1);
        toSec.entries.splice(toEntryIdx, 0, movedEntry);
        
        saveStateToStorage(); renderSections(); updatePreview();
    }
    this.classList.remove("drag-over");
}