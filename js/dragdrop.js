import { state } from "./state.js";
import { renderSections } from "./main.js";

class DragDropManager {
  constructor() {
    this.draggedSection = null;
    this.draggedEntry = null;
  }

  // Section drag handlers
  handleSectionDragStart(e) {
    this.draggedSection = e.currentTarget;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  handleSectionDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (
      this.draggedSection &&
      e.currentTarget.dataset.sectionId &&
      this.draggedSection !== e.currentTarget
    ) {
      const fromIdx = state
        .get()
        .sections.findIndex(
          (s) => s.id === this.draggedSection.dataset.sectionId,
        );
      const toIdx = state
        .get()
        .sections.findIndex((s) => s.id === e.currentTarget.dataset.sectionId);

      if (fromIdx !== toIdx && fromIdx !== -1 && toIdx !== -1) {
        state.moveSection(fromIdx, toIdx);
        renderSections();
      }
    }

    e.currentTarget.classList.remove("drag-over");
  }

  // Entry drag handlers
  handleEntryDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.draggedEntry && e.currentTarget.dataset.entryId) {
      const draggedSectionId = this.draggedEntry.dataset.sectionId;
      const targetSectionId = e.currentTarget.dataset.sectionId;

      if (draggedSectionId && targetSectionId) {
        const fromSec = state.findSection(draggedSectionId);
        const toSec = state.findSection(targetSectionId);

        const fromEntryIdx = fromSec.entries.findIndex(
          (entry) => entry.id === this.draggedEntry.dataset.entryId,
        );
        const toEntryIdx = toSec.entries.findIndex(
          (entry) => entry.id === e.currentTarget.dataset.entryId,
        );

        if (fromSec && toSec && fromEntryIdx !== -1 && toEntryIdx !== -1) {
          state.moveEntry(
            draggedSectionId,
            targetSectionId,
            fromEntryIdx,
            toEntryIdx,
          );
          renderSections();
        }
      }
    }

    e.currentTarget.classList.remove("drag-over");
  }

  // Shared handlers
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  handleDragEnd(e) {
    if (this.draggedSection) {
      this.draggedSection.classList.remove("dragging");
    }
    if (this.draggedEntry) {
      this.draggedEntry.classList.remove("dragging");
    }

    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    this.draggedSection = null;
    this.draggedEntry = null;
  }

  // Attach listeners to sections
  attachSectionListeners(element) {
    element.addEventListener(
      "dragstart",
      this.handleSectionDragStart.bind(this),
    );
    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("dragleave", this.handleDragLeave.bind(this));
    element.addEventListener("drop", this.handleSectionDrop.bind(this));
    element.addEventListener("dragend", this.handleDragEnd.bind(this));
  }

  // Attach listeners to entries (drag only from handle)
  attachEntryListeners(element, dragHandle) {
    // Only the drag handle initiates drag
    dragHandle.addEventListener("dragstart", (e) => {
      this.draggedEntry = element;
      element.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.stopPropagation();
    });

    dragHandle.addEventListener("dragend", this.handleDragEnd.bind(this));

    // Drop events on the whole entry div
    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("dragleave", this.handleDragLeave.bind(this));
    element.addEventListener("drop", this.handleEntryDrop.bind(this));
  }
}

export const dragDropManager = new DragDropManager();
