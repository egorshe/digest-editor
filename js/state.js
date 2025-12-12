import { sectionTypes } from './config.js';
import { generateId } from './utils.js';

export let state = {
    frontmatter: {},
    sections: [],
};

export function updateState(newState) {
    state = newState;
}

export function createSectionObject(type, customTitle = null) {
    return {
        id: generateId(),
        type: type,
        title: customTitle || sectionTypes[type].title,
        entries: [],
    };
}

export function initDefaults() {
    state.sections = [];
    state.sections.push(createSectionObject("publications"));
    state.sections.push(createSectionObject("conferences"));
    state.sections.push(createSectionObject("news"));
    saveStateToStorage();
}

export function saveStateToStorage() {
    // Capture frontmatter from DOM if available
    const titleEl = document.getElementById("docTitle");
    if(titleEl) {
        state.frontmatter = {
            title: document.getElementById("docTitle").value,
            date: document.getElementById("docDate").value,
            tags: document.getElementById("docTags").value,
            draft: document.getElementById("docDraft").value,
        };
    }
    localStorage.setItem("digestState", JSON.stringify(state));
}

export function loadStateFromStorage() {
    const saved = localStorage.getItem("digestState");
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading state", e);
            state = { frontmatter: {}, sections: [] };
        }
    }
}