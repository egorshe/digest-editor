export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

export function toTitleCase(str) {
  if (!str) return str;

  const lowercase = new Set([
    "a",
    "an",
    "the",
    "and",
    "but",
    "or",
    "nor",
    "for",
    "yet",
    "so",
    "at",
    "by",
    "in",
    "of",
    "on",
    "to",
    "up",
    "as",
    "is",
    "if",
    "it",
    "from",
    "into",
    "with",
    "via",
    "per",
    "for",
    "vs",
  ]);

  return str
    .toLowerCase()
    .split(" ")
    .map((word, index, array) => {
      if (index === 0 || index === array.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      if (lowercase.has(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function mapCSLType(cslType) {
  const typeMap = {
    book: "Book",
    chapter: "Chapter",
    "article-journal": "Article",
    "article-magazine": "Article",
    "article-newspaper": "Article",
    "paper-conference": "Article",
    thesis: "Thesis",
    webpage: "Online Article",
    "post-weblog": "Blog Post",
  };
  return typeMap[cslType] || "Article";
}

export function formatCSLDate(issued) {
  if (!issued) return "";
  if (issued["date-parts"] && issued["date-parts"][0]) {
    return issued["date-parts"][0].join("-");
  }
  if (issued.raw) return issued.raw;
  return "";
}

// Validation functions
export function validateDate(dateStr) {
  if (!dateStr) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function validateURL(url) {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
}

// Debounce helper
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Shared sorting utility - used by both preview and export
export function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    // Sort by importance (1 first, then 2, then 3)
    if ((a.importance || 2) !== (b.importance || 2)) {
      return (a.importance || 2) - (b.importance || 2);
    }

    // Then by date (newest first)
    if (a.date && b.date && a.date !== b.date) {
      return new Date(b.date) - new Date(a.date);
    }

    // Then by title alphabetically
    return (a.title || "").localeCompare(b.title || "");
  });
}

// Error handling for localStorage operations
export function safeLocalStorage() {
  return {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error("localStorage.getItem failed:", e);
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error("localStorage.setItem failed:", e);
        alert("Failed to save data. Storage may be full.");
        return false;
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("localStorage.removeItem failed:", e);
      }
    },
  };
}
