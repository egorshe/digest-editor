# Digest Generator

A web-based markdown editor for creating academic digests with support for publications, conferences, exhibitions, etc. Features drag-and-drop organization, Zotero import, GitHub Gist sync, and Jekyll-compatible markdown output.

## Features

- 📚 **Publication Management**: Citations in MLA 9th edition format
- 🎬 **Event Management**: Conferences, exhibitions, festivals with location data in YAML
- 🔄 **Zotero Integration**: Import .bib with duplicate detection
- ☁️ **GitHub Gist Sync**: Cloud storage with auto-discovery
- ⬇️ **Export Options**: Markdown, JSON
- 🖱️ **Drag & Drop**: Reorder sections and entries

---

## Project Structure

### Files

```
digest-generator/
├── index.html              # Main HTML structure
├── js/
│   ├── main.js            # Application initialization & orchestration
│   ├── state.js           # State management
│   ├── ui.js              # UI rendering & form generation
│   ├── io.js              # Import/export & drag-and-drop
│   ├── generators.js      # Markdown generation for each entry type
│   ├── frontmatter.js     # YAML frontmatter generation
│   ├── gist.js            # GitHub Gist API integration
│   ├── config.js          # Section type definitions
│   └── utils.js           # Helper functions
```

---

## File-by-File Documentation

### `index.html`
**Role**: Main application structure and UI layout

**Key Elements**:
- Split-pane layout (editor on left, preview on right)
- Frontmatter input fields (title, date, tags, draft status)
- Locations editor (collapsible)
- Sections container (dynamically populated)
- Gist modal for cloud sync
- File inputs for JSON/Zotero import

**Modify this when**: Changing overall layout, adding new UI sections, or modifying modal structure

---

### `js/main.js`
**Role**: Application initialization, event wiring, and orchestration

**Modify this when**: Adding new global actions, changing event handling, or modifying preview logic

---

### `js/state.js`
**Role**: Centralized state management with observer pattern

**Modify this when**: Changing data structure, adding new state operations, or modifying state logic

---

### `js/ui.js`
**Role**: UI rendering and form generation

**Modify this when**: Changing form layouts, adding new entry types, or modifying field rendering

---

### `js/io.js`
**Role**: Import/export operations and drag-and-drop management

**Modify this when**: Adding new import formats, changing export logic, or modifying drag behavior

---

### `js/generators.js`
**Role**: Generates markdown for each entry type

**Modify this when**: Changing citation formats, adding new entry types, or modifying output styling

---

### `js/frontmatter.js`
**Role**: YAML frontmatter generation and location collection

**Modify this when**: Changing frontmatter structure, adding metadata fields, or modifying location logic

---

### `js/gist.js`
**Role**: GitHub Gist API integration

**Modify this when**: Adding new cloud storage providers, changing sync behavior, or modifying API interactions

---

### `js/config.js`
**Role**: Configuration and constants

**Modify this when**: Adding new section types or changing default section titles/icons

---

### `js/utils.js`
**Role**: Shared utility functions

**Modify this when**: Adding shared utilities, validation functions, or formatting helpers

---

## Data Flow

```
User Action → main.js (global function)
           ↓
       state.js (update state)
           ↓
       state.notify() (triggers subscribers)
           ↓
       ┌─────────────┬─────────────┐
       ↓             ↓             ↓
   ui.js      updatePreview()   io.js
(re-render)    (re-generate)  (auto-save)
```

---

## State Persistence

1. **Auto-save**: Debounced localStorage save (1 second after changes)
2. **Manual save**: JSON export or Gist sync
3. **Load priority**: Gist > localStorage > defaults

---

## Key Technologies

- **Vanilla JavaScript** (ES6 modules)
- **Tailwind CSS** (via CDN)
- **GitHub API** (Gist integration)
- **CSL-JSON** (Zotero bibliographies)
- **YAML** (Jekyll frontmatter)
- **Markdown** (output format)

---
