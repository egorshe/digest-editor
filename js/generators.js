// === HELPER FUNCTIONS ===

// Helper function to format descriptions with Jekyll-compatible line breaks
function formatJekyllText(text) {
  if (!text) return "";
  // Replace single newlines with double-space + newline for Jekyll
  return text.replace(/\n/g, "  \n");
}

// Helper function to format URLs with proper link text
function formatURL(url, customText = null, isOpenAccess = false) {
  if (!url) return "";

  // If open access, use the badge as the link
  if (isOpenAccess) {
    return ` [<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span>](${url})`;
  }

  // Check if it's a DOI URL
  if (url.includes("doi.org/")) {
    const doiMatch = url.match(/10\.\d{4,}\/[^\s]+/);
    if (doiMatch) {
      return ` [DOI](${url})`;
    }
  }

  // Use custom text or default to "link"
  return ` [${customText || "link"}](${url})`;
}

// === MARKDOWN GENERATORS ===

export function generatePublicationMarkdown(entry) {
  let md = "";

  // Format authors: Last Name, First Name
  const authors = entry.authors
    .filter((a) => a.surname || a.name)
    .map((a, idx) => {
      // First author: Last, First
      if (idx === 0) {
        return `${a.surname}, ${a.name}`;
      }
      // Subsequent authors: First Last
      return `${a.name} ${a.surname}`;
    })
    .join(", ");

  if (authors) md += `${authors}. `;

  // Format based on publication type following MLA 9th edition
  if (entry.pubType === "Book") {
    // Book: Author. *Title*. Publisher, Year.
    md += `*${entry.title}*`;
    if (entry.publisher) md += `. ${entry.publisher}`;
    if (entry.date) {
      const year = entry.date.split("-")[0];
      md += `, ${year}`;
    }
    md += ".";
    // Add link for books
    if (entry.url) {
      md += formatURL(entry.url, entry.urlText, entry.openAccess);
    }
  } else if (entry.pubType === "Chapter") {
    // Chapter: Author. "Title." *Book Title*, edited by Editor, Publisher, Year, pp. pages.
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    if (entry.publisher) md += `, ${entry.publisher}`;
    if (entry.date) {
      const year = entry.date.split("-")[0];
      md += `, ${year}`;
    }
    md += ".";
    // Add link for chapters
    if (entry.url) {
      md += formatURL(entry.url, entry.urlText, entry.openAccess);
    }
  } else if (
    entry.pubType === "Article" ||
    entry.pubType === "Online Article"
  ) {
    // Article: Author. "Title." *Journal*, vol. #, no. #, Date, [DOI/link].
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    if (entry.volume) md += `, vol. ${entry.volume}`;
    if (entry.issue) md += `, no. ${entry.issue}`;
    if (entry.date) {
      md += `, ${formatMLADate(entry.date)}`;
    }
    // Add formatted URL/DOI for articles
    if (entry.url) {
      md += formatURL(entry.url, entry.urlText, entry.openAccess);
    }
    md += ".";
  } else if (entry.pubType === "Thesis") {
    // Thesis: Author. *Title*. Year. Institution, Thesis type.
    md += `*${entry.title}*`;
    if (entry.date) {
      const year = entry.date.split("-")[0];
      md += `. ${year}`;
    }
    if (entry.publisher) md += `. ${entry.publisher}`;
    md += ".";
    // Add link for theses
    if (entry.url) {
      md += formatURL(entry.url, entry.urlText, entry.openAccess);
    }
  } else {
    // Default fallback
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    if (entry.volume) md += `, vol. ${entry.volume}`;
    if (entry.issue) md += `, no. ${entry.issue}`;
    if (entry.publisher) md += `, ${entry.publisher}`;
    if (entry.date) md += `, ${entry.date}`;
    if (entry.url) {
      md += formatURL(entry.url, entry.urlText, entry.openAccess);
    }
    md += ".";
  }

  md += "\n";

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*\n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}\n`;
  }

  if (entry.abstract) {
    const summaryLabel =
      entry.pubType === "Book" ||
      entry.pubType === "Chapter" ||
      entry.pubType === "Thesis"
        ? "Annotation"
        : "Abstract";
    md += `<details markdown="1"><summary>${summaryLabel}</summary>\n${formatJekyllText(entry.abstract)}\n</details>\n`;
  }

  md += "\n";
  return md;
}

function formatMLADate(dateStr) {
  if (!dateStr) return "";

  const months = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May",
    "June",
    "July",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return `${day} ${months[month]} ${year}`;
  } else if (parts.length === 2) {
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    return `${months[month]} ${year}`;
  } else if (parts.length === 1) {
    return parts[0];
  }

  return dateStr;
}

export function generateJournalMarkdown(entry) {
  let md = "";

  if (entry.journalName) md += `*${entry.journalName}*`;
  if (entry.volume) md += `, Vol. ${entry.volume}`;
  if (entry.issue) md += `, No. ${entry.issue}`;
  if (entry.date) md += ` (${entry.date})`;
  if (entry.theme) md += `: "${entry.theme}"`;
  if (entry.guestEditor) md += `, edited by ${entry.guestEditor}`;
  md += ".  \n";

  if (entry.description) {
    md += `${formatJekyllText(entry.description)}  \n`;
  }

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) {
    if (entry.openAccess) {
      md += `[<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span>](${entry.url})`;
    } else {
      md += `[${entry.urlText || "Link"}](${entry.url})`;
    }
  }

  md += "\n\n";
  return md;
}

export function generateEventMarkdown(entry) {
  let md = "";
  if (entry.title) {
    md += `**${entry.title}**`;
    if (entry.theme) md += ` "${entry.theme}"`;
    md += "  \n";
  }
  if (entry.dateStart)
    md += `Dates: ${entry.dateStart}${entry.dateEnd ? " to " + entry.dateEnd : ""}  \n`;
  if (entry.cfpDeadline) md += `CfP Deadline: ${entry.cfpDeadline}  \n`;
  if (entry.place)
    md += `Place: ${entry.place}${entry.venue ? ", " + entry.venue : ""}  \n`;
  if (entry.description)
    md += `Description: ${formatJekyllText(entry.description)}  \n`;

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) md += `[Website](${entry.url})  \n`;
  md += "\n";
  return md;
}

export function generateCallMarkdown(entry) {
  let md = "";
  if (entry.title) md += `**${entry.title}** - ${entry.theme || ""}  \n`;
  if (entry.deadline) md += `Deadline: ${entry.deadline}  \n`;

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) md += `[Apply](${entry.url})  \n`;
  md += "\n";
  return md;
}

export function generateMediaMarkdown(entry) {
  let md = "";
  if (entry.title)
    md += `**${entry.title}** (${entry.mediaType || "Media"})  \n`;
  if (entry.creator) md += `By: ${entry.creator}  \n`;
  if (entry.description) md += `${formatJekyllText(entry.description)}  \n`;

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) md += `[Watch/Listen](${entry.url})  \n`;
  md += "\n";
  return md;
}
