// js/utils.js - Enhanced utilities with validation
export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

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
  if (!dateStr) return true; // Empty is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function validateURL(url) {
  if (!url) return true; // Empty is valid
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
