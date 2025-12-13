// js/ui.js - UI helper functions and modals
import { state } from "./state.js";
import { gistManager } from "./gist.js";
import { renderSections, updatePreview } from "./main.js";

let currentGistAction = "";

export function openGistModal(action) {
  currentGistAction = action;
  const modal = document.getElementById("gistModal");
  const title = document.getElementById("gistModalTitle");
  const button = document.getElementById("gistActionButton");

  // Load persisted token/ID
  const persistedToken = sessionStorage.getItem("gistToken");
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
