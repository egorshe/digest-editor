import { state, initDefaults, saveStateToStorage, loadStateFromStorage, createSectionObject, updateState } from './state.js';
import { generateId } from './utils.js';
import { sectionTypes } from './config.js';
import * as Renderers from './renderers.js';
import * as Generators from './generators.js';
import * as Importers from './importers.js';

// --- INITIALIZATION ---
window.onload = function() {
    loadStateFromStorage();
    if (!state.frontmatter.title) {
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
    if(confirm("Are you sure you want to delete ALL data and reset the editor?")) {
        localStorage.removeItem("digestState");
        localStorage.removeItem("gistId");
        sessionStorage.removeItem("gistToken");
        updateState({ frontmatter: {}, sections: [] });
        document.getElementById("docTitle").value = "";
        document.getElementById("docDate").value = "";
        document.getElementById("docTags").value = "";
        initDefaults();
        renderSections();
        updatePreview();
        alert("Editor has been completely reset.");
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
    const title = prompt("Enter Custom Section Title:");
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
        entry.urlText = "link";
        entry.openAccess = false;
        entry.description = "";
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
    // Handle checkbox value conversion
    entry[field] = (typeof entry[field] === 'boolean') ? !!value : value; 
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
    a.download = `${state.frontmatter.title.replace(/\s/g, '-') || 'digest'}.md`;
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
        const type = section.type;
        const entryMap = {
            "publications": { type: "publication", text: "Publication" },
            "journalIssues": { type: "journalIssue", text: "Journal Issue" },
            "conferences": { type: "conference", text: "Conference" },
            "callForPapers": { type: "callForPapers", text: "Call" },
            "festivals": { type: "festival", text: "Festival" },
            "exhibitions": { type: "exhibition", text: "Exhibition" },
            "media": { type: "media", text: "Media Entry" },
            "news": { type: "text", text: "News Item" },
            "quickLinks": { type: "text", text: "Link Item" },
            "custom": { type: "text", text: "Entry" }
        };
        const entryConfig = entryMap[type] || entryMap["custom"];

        html += `<button onclick="addEntry('${section.id}', '${entryConfig.type}')" class="mb-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition font-medium">+ Add ${entryConfig.text}</button>`;


        html += '<div class="space-y-4">';
        
        // Entries
        section.entries.forEach((entry, idx) => {
            html += `<div class="p-3 bg-gray-750 bg-gray-700/50 rounded border border-gray-600 cursor-move hover:border-gray-500 transition" draggable="true" data-entry-id="${entry.id}" data-section-id="${section.id}">`;
            html += `<div class="flex justify-between items-center mb-2"><span class="text-xs text-gray-400 font-mono">:: Entry ${idx + 1}</span><button onclick="deleteEntry('${section.id}', '${entry.id}')" class="text-red-400 hover:text-red-300 text-xs">✕</button></div>`;
            
            if (entry.type === "publication") {
                html += Renderers.renderPublicationForm(section.id, entry);
            } else if (entry.type === "journalIssue") {
                html += Renderers.renderJournalForm(section.id, entry);
            } else if (["conference", "exhibition", "festival"].includes(entry.type)) {
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
            else if (entry.type === "journalIssue") md += Generators.generateJournalMarkdown(entry);
            else if (["conference", "exhibition", "festival"].includes(entry.type)) md += Generators.generateEventMarkdown(entry);
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
        if (fromIdx !== toIdx) {
            const [removed] = state.sections.splice(fromIdx, 1);
            state.sections.splice(toIdx, 0, removed);
            saveStateToStorage(); renderSections(); updatePreview();
        }
    }
    this.classList.remove("drag-over");
}

function handleEntryDrop(e) {
    e.stopPropagation(); e.preventDefault();
    if(draggedEntry && this.dataset.entryId) {
        const draggedSectionId = draggedEntry.dataset.sectionId;
        const targetSectionId = this.dataset.sectionId;

        // Ensure both are valid
        if (draggedSectionId && targetSectionId) {
            const fromSec = state.sections.find(s => s.id === draggedSectionId);
            const toSec = state.sections.find(s => s.id === targetSectionId);
            
            const fromEntryIdx = fromSec.entries.findIndex(e => e.id === draggedEntry.dataset.entryId);
            const toEntryIdx = toSec.entries.findIndex(e => e.id === this.dataset.entryId);
            
            // Only proceed if moving an entry within the same section or to a different one
            if (fromSec && toSec && fromEntryIdx !== -1 && toEntryIdx !== -1) {
                const [movedEntry] = fromSec.entries.splice(fromEntryIdx, 1);
                
                // If moving to a different section, check if the target section type is compatible
                // Since all sections use generic data/text except publications/journals, we'll allow most moves but keep pub/journal separate
                if (draggedSectionId !== targetSectionId) {
                    // For simplicity, we'll allow all moves for now, but in a production app, you'd check entry compatibility here.
                }

                toSec.entries.splice(toEntryIdx, 0, movedEntry);
                
                saveStateToStorage(); 
                renderSections(); 
                updatePreview();
            }
        }
    }
    this.classList.remove("drag-over");
}


// --- GIST CLOUD STORAGE FUNCTIONS ---
let currentGistAction = '';

function getGistConfig() {
    // Get values from input fields, falling back to storage if fields are empty
    return {
        token: document.getElementById('gistToken').value || sessionStorage.getItem('gistToken'),
        id: document.getElementById('gistId').value || localStorage.getItem('gistId'),
        filename: 'digest-draft.json'
    };
}

window.openGistModal = function(action) {
    currentGistAction = action;
    const modal = document.getElementById('gistModal');
    const title = document.getElementById('gistModalTitle');
    const button = document.getElementById('gistActionButton');
    
    // Load persisted token/ID
    const persistedToken = sessionStorage.getItem('gistToken');
    const persistedId = localStorage.getItem('gistId');

    document.getElementById('gistToken').value = persistedToken || '';
    document.getElementById('gistId').value = persistedId || '';
    
    if (action === 'save') {
        title.textContent = 'Save Draft to Gist';
        button.textContent = persistedId ? 'Update Existing Gist' : 'Create New Gist';
    } else if (action === 'load') {
        title.textContent = 'Load Draft from Gist';
        button.textContent = 'Load Draft';
    }

    modal.style.display = 'flex';
};

window.closeGistModal = function() {
    document.getElementById('gistModal').style.display = 'none';
};

window.gistAction = async function() {
    const config = getGistConfig();
    const actionButton = document.getElementById('gistActionButton');
    actionButton.disabled = true;
    actionButton.textContent = 'Processing...';

    if (!config.token) {
        alert("Please enter your GitHub Personal Access Token.");
        actionButton.disabled = false;
        actionButton.textContent = 'Perform Action';
        return;
    }

    // Persist Token to Session Storage (Cleared when browser closes)
    sessionStorage.setItem('gistToken', config.token);

    if (currentGistAction === 'save') {
        const gistId = await saveToGist(config);
        if (gistId) {
            localStorage.setItem('gistId', gistId);
            document.getElementById('gistId').value = gistId;
            actionButton.textContent = 'Update Existing Gist';
            alert(`Draft successfully saved! Gist ID: ${gistId}`);
        }
    } else if (currentGistAction === 'load') {
        const loadedState = await loadFromGist(config);
        if (loadedState) {
            updateState(loadedState);
            saveStateToStorage();
            
            // Re-populate Frontmatter inputs
            document.getElementById("docTitle").value = state.frontmatter.title || "";
            document.getElementById("docDate").value = state.frontmatter.date || "";
            document.getElementById("docTags").value = state.frontmatter.tags || "";
            document.getElementById("docDraft").value = state.frontmatter.draft || "true";
            
            renderSections();
            updatePreview();
            alert("Draft loaded successfully from Gist!");
        }
    }
    
    actionButton.disabled = false;
    actionButton.textContent = 'Perform Action';
    closeGistModal();
};

async function saveToGist(config) {
    const data = JSON.stringify(state, null, 2);
    const url = config.id ? `https://api.github.com/gists/${config.id}` : `https://api.github.com/gists`;
    const method = config.id ? 'PATCH' : 'POST';

    const payload = {
        description: `Digest Generator Draft - ${state.frontmatter.title || 'Untitled'}`,
        public: false, // Recommended: keep drafts private
        files: {
            [config.filename]: {
                content: data
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`GitHub API Error (${response.status}): ${errorBody.message || response.statusText}`);
        }

        const json = await response.json();
        return json.id; // Returns Gist ID
    } catch (error) {
        console.error("Failed to save to Gist:", error);
        alert(`Error saving to Gist: ${error.message}. Check your PAT, Gist ID, and network connection.`);
        return null;
    }
}

async function loadFromGist(config) {
    if (!config.id) {
        alert("Please enter a Gist ID to load.");
        return null;
    }

    const url = `https://api.github.com/gists/${config.id}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`GitHub API Error (${response.status}): ${errorBody.message || response.statusText}`);
        }

        const json = await response.json();
        const fileContent = json.files[config.filename]?.content;

        if (!fileContent) {
            alert(`File "${config.filename}" not found in Gist ID: ${config.id}. Make sure the file name is correct.`);
            return null;
        }

        return JSON.parse(fileContent);

    } catch (error) {
        console.error("Failed to load from Gist:", error);
        alert(`Error loading from Gist: ${error.message}. Check your Gist ID, PAT, and network connection.`);
        return null;
    }
}
