// js/dragdrop.js - Drag and drop functionality
import { state } from "./state.js";

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

    if (this.draggedSection && e.currentTarget.dataset.sectionId) {
      const fromIdx = state
        .get()
        .sections.findIndex(
          (s) => s.id === this.draggedSection.dataset.sectionId,
        );
      const toIdx = state
        .get()
        .sections.findIndex((s) => s.id === e.currentTarget.dataset.sectionId);

      console.log(`🔄 Moving section from index ${fromIdx} to ${toIdx}`);

      if (fromIdx !== toIdx && fromIdx !== -1 && toIdx !== -1) {
        state.moveSection(fromIdx, toIdx);
        console.log("✅ Section moved successfully");
      }
    }

    e.currentTarget.classList.remove("drag-over");
  }

  // Entry drag handlers
  handleEntryDragStart(e) {
    this.draggedEntry = e.currentTarget;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  }

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

  // Attach listeners to elements
  attachSectionListeners(element) {
    element.addEventListener(
      "dragstart",
      this.handleSectionDragStart.bind(this),
    );
    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("drop", this.handleSectionDrop.bind(this));
    element.addEventListener("dragend", this.handleDragEnd.bind(this));
  }

  attachEntryListeners(element) {
    element.addEventListener("dragstart", this.handleEntryDragStart.bind(this));
    element.addEventListener("dragover", this.handleDragOver.bind(this));
    element.addEventListener("drop", this.handleEntryDrop.bind(this));
    element.addEventListener("dragend", this.handleDragEnd.bind(this));
  }
}

export const dragDropManager = new DragDropManager();
