function formatJekyllText(text) {
  if (!text) return "";
  return text.replace(/\n/g, "  \n");
}

function formatURL(url, customText = null, isOpenAccess = false) {
  if (!url) return "";
  if (isOpenAccess) {
    return ` [<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span>](${url})`;
  }
  if (url.includes("doi.org/")) {
    const doiMatch = url.match(/10\.\d{4,}\/[^\s]+/);
    if (doiMatch) {
      return ` [DOI](${url})`;
    }
  }

  return ` [${customText || "link"}](${url})`;
}

function addLineBreak() {
  return "  \n";
}

// === ICS / CALENDAR HELPERS ===

function pad(n) {
  return String(n).padStart(2, "0");
}

function utcStamp() {
  const now = new Date();
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/**
 * Parse a time string like "17:00", "17h00", "5pm" → "170000"
 * Returns null if unparseable.
 */
function parseICSTime(str) {
  if (!str) return null;
  const m = str.trim().match(/^(\d{1,2})(?:[h:](\d{2}))?(?:\s*(am|pm))?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3] ? m[3].toLowerCase() : null;
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  return `${pad(h)}${pad(min)}00`;
}

/**
 * Build a data: URI for an ICS file from an event entry.
 * Returns null if there is no date to anchor the event.
 */
function buildCalendarDataUri(entry) {
  if (!entry.date) return null;

  const title = entry.title || "Event";
  const baseDateStr = entry.date.replace(/-/g, "");
  const uid = `${entry.date}-${title.replace(/[^a-z0-9]/gi, "").toLowerCase()}@digest`;
  const desc = (entry.description || "").replace(/\n/g, "\\n");
  const location = [entry.venue, entry.place].filter(Boolean).join(", ");

  let dtStart, dtEnd, isAllDay = true;

  if (entry.timeRange) {
    // Split on " - ", "–", " to " (case-insensitive)
    const parts = entry.timeRange.split(/\s*[-–]\s*|\s+to\s+/i).map((t) => t.trim());
    const startTime = parseICSTime(parts[0]);
    if (startTime) {
      isAllDay = false;
      dtStart = `${baseDateStr}T${startTime}`;
      const endTime = parts[1] ? parseICSTime(parts[1]) : null;
      if (endTime) dtEnd = `${baseDateStr}T${endTime}`;
    }
  }

  if (isAllDay) dtStart = baseDateStr;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Digest//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp()}`,
    `SUMMARY:${title}`,
    isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
  ];

  if (!isAllDay && dtEnd) lines.push(`DTEND:${dtEnd}`);
  if (location)           lines.push(`LOCATION:${location}`);
  if (desc)               lines.push(`DESCRIPTION:${desc}`);
  if (entry.url)          lines.push(`URL:${entry.url}`);

  lines.push("END:VEVENT", "END:VCALENDAR");

  const icsContent = lines.join("\r\n");
  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
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

  // FIXED: Add proper line break after citation
  md += addLineBreak();

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*`;
    md += addLineBreak();
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}`;
    md += addLineBreak();
  }

  if (entry.abstract) {
    const summaryLabel =
      entry.pubType === "Book" ||
      entry.pubType === "Chapter" ||
      entry.pubType === "Thesis"
        ? "Annotation"
        : "Abstract";
    md += `<details markdown="1"><summary>${summaryLabel}</summary>\n${formatJekyllText(entry.abstract)}\n</details>`;
    md += addLineBreak();
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
  md += ".";
  md += addLineBreak();

  if (entry.description) {
    md += `${formatJekyllText(entry.description)}`;
    md += addLineBreak();
  }

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*`;
    md += addLineBreak();
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}`;
    md += addLineBreak();
  }

  if (entry.url) {
    if (entry.openAccess) {
      md += `[<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span>](${entry.url})`;
    } else {
      md += `[${entry.urlText || "Link"}](${entry.url})`;
    }
    md += addLineBreak();
  }

  md += "\n";
  return md;
}

export function generateEventMarkdown(entry) {
  let md = "";
  const isTalk = entry.type === "talk";

  // 1. Title, Talk Type, and Theme/Context
  if (entry.title) {
    md += `**${entry.title}**`;
    if (isTalk) {
      const displayType = entry.customEventType || entry.eventTypeSelector || "Talk";
      md += ` (${displayType})`;
    }
    if (entry.theme) md += ` "${entry.theme}"`;
    md += addLineBreak();
  }

  // 2. Speaker
  if (entry.speaker) {
    md += `By: ${entry.speaker}`;
    md += addLineBreak();
  }

  // 3. Dates, Time, and Calendar Link
  if (isTalk) {
    if (entry.date || entry.timeRange) {
      let dateLine = "";
      if (entry.date && entry.timeRange) {
        dateLine = `Date: ${entry.date} (${entry.timeRange})`;
      } else if (entry.date) {
        dateLine = `Date: ${entry.date}`;
      } else {
        dateLine = `Time: ${entry.timeRange}`;
      }
      const calUri = buildCalendarDataUri(entry);
      if (calUri) {
        const safeFilename = (entry.title || "event").replace(/[^a-z0-9]/gi, "_").toLowerCase();
        md += `${dateLine} <a href="${calUri}" download="${safeFilename}.ics">📅 Add to Calendar</a>`;
      } else {
         md += dateLine;
      }
      md += addLineBreak();
      }
  } else if (entry.dateStart) {
    md += `Dates: ${entry.dateStart}${entry.dateEnd ? " to " + entry.dateEnd : ""}`;
    md += addLineBreak();
  }

  if (entry.cfpDeadline) {
    md += `CfP Deadline: ${entry.cfpDeadline}`;
    md += addLineBreak();
  }

  if (entry.place) {
    md += `Place: ${entry.place}${entry.venue ? ", " + entry.venue : ""}`;
    md += addLineBreak();
  }

  if (entry.description) {
    md += `Description: ${formatJekyllText(entry.description)}`;
    md += addLineBreak();
  }

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*`;
    md += addLineBreak();
  }

  if (entry.signal) {
    md += `**Signal**: ${entry.signal}`;
    md += addLineBreak();
  }

  if (entry.url) {
    md += `[Website](${entry.url})`;
    md += addLineBreak();
  }

  md += "\n";
  return md;
}

export function generateCallMarkdown(entry) {
  let md = "";

  if (entry.title) {
    md += `**${entry.title}**`;
    if (entry.theme) md += ` - ${entry.theme}`;
    md += addLineBreak();
  }

  if (entry.deadline) {
    md += `Deadline: ${entry.deadline}`;
    md += addLineBreak();
  }

  if (entry.description) {
    md += `${formatJekyllText(entry.description)}`;
    md += addLineBreak();
  }

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*`;
    md += addLineBreak();
  }

  if (entry.signal) {
    md += `**Signal**: ${entry.signal}`;
    md += addLineBreak();
  }

  if (entry.url) {
    md += `[Apply](${entry.url})`;
    md += addLineBreak();
  }

  md += "\n";
  return md;
}

export function generateMediaMarkdown(entry) {
  let md = "";

  if (entry.title) {
    md += `**${entry.title}** (${entry.mediaType || "Media"})`;
    md += addLineBreak();
  }

  if (entry.creator) {
    md += `By: ${entry.creator}`;
    md += addLineBreak();
  }

  if (entry.description) {
    md += `${formatJekyllText(entry.description)}`;
    md += addLineBreak();
  }

  if (entry.whyItMatters) {
    md += `*${formatJekyllText(entry.whyItMatters)}*`;
    md += addLineBreak();
  }

  if (entry.signal) {
    md += `**Signal**: ${entry.signal}`;
    md += addLineBreak();
  }

  if (entry.url) {
    md += `[Watch/Listen](${entry.url})`;
    md += addLineBreak();
  }

  md += "\n";
  return md;
}