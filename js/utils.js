export const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export function toTitleCase(str) {
  if (!str) return str;

  const lowercase = new Set([
    "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
    "at", "by", "in", "of", "on", "to", "up", "as", "is", "if", "it",
    "from", "into", "with", "via", "per", "vs",
  ]);

  const words = str.toLowerCase().split(/\s+/);

  return words
    .map((word, index) => {
      const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, "");
      if (index > 0 && index < words.length - 1 && lowercase.has(cleanWord)) {
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
  if (issued["date-parts"]?.[0]) {
    const [year, month, day] = issued["date-parts"][0];
    if (!year) return "";
    const pMonth = month ? String(month).padStart(2, "0") : null;
    const pDay = day ? String(day).padStart(2, "0") : null;
    return [year, pMonth, pDay].filter(Boolean).join("-");
  }
  return issued.raw || "";
}

export function validateDate(dateStr) {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
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

export function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const impA = a.importance ?? 2;
    const impB = b.importance ?? 2;
    if (impA !== impB) {
      return impA - impB;
    }

    if (a.date && b.date && a.date !== b.date) {
      return new Date(b.date) - new Date(a.date);
    }

    return (a.title || "").localeCompare(b.title || "");
  });
}

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
        return false;
      }
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error("localStorage.removeItem failed:", e);
        return false;
      }
    },
  };
}