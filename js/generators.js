export function generatePublicationMarkdown(entry) {
  let md = "";

  if (entry.openAccess) {
    md += `<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span> `;
  }

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
      // Extract year from date
      const year = entry.date.split("-")[0];
      md += `, ${year}`;
    }
    md += ".";
  } else if (entry.pubType === "Chapter") {
    // Chapter: Author. "Title." *Book Title*, edited by Editor, Publisher, Year, pp. pages.
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    // Note: MLA would need editor info here, but we don't have that field
    if (entry.publisher) md += `, ${entry.publisher}`;
    if (entry.date) {
      const year = entry.date.split("-")[0];
      md += `, ${year}`;
    }
    md += ".";
  } else if (entry.pubType === "Article" || entry.pubType === "Online Article") {
    // Article: Author. "Title." *Journal*, vol. #, no. #, Date, URL/DOI.
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    if (entry.volume) md += `, vol. ${entry.volume}`;
    if (entry.issue) md += `, no. ${entry.issue}`;
    if (entry.date) {
      // Format date as Day Month Year (MLA style)
      md += `, ${formatMLADate(entry.date)}`;
    }
    if (entry.url) md += `, ${entry.url}`;
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
  } else {
    // Default fallback
    md += `"${entry.title}."`;
    if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
    if (entry.volume) md += `, vol. ${entry.volume}`;
    if (entry.issue) md += `, no. ${entry.issue}`;
    if (entry.publisher) md += `, ${entry.publisher}`;
    if (entry.date) md += `, ${entry.date}`;
    md += ".";
  }

// Add custom link text if URL provided but not already included
  if (entry.url && (entry.pubType === "Book" || entry.pubType === "Chapter" || entry.pubType === "Thesis")) {
    md += ` [${entry.urlText || "link"}](${entry.url})`;
  }
  
  md += "\n";

  if (entry.whyItMatters) {
    md += `*${entry.whyItMatters}*\n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}\n`;
  }

  if (entry.abstract) {
    const summaryLabel = (entry.pubType === "Book" || entry.pubType === "Chapter" || entry.pubType === "Thesis") 
      ? "Annotation" 
      : "Abstract";
    md += `<details markdown="1"><summary>${summaryLabel}</summary>\n${entry.abstract}\n</details>\n`;
  }
  
  md += "\n";
  return md;
}

function formatMLADate(dateStr) {
  if (!dateStr) return "";
  
  const months = [
    "Jan.", "Feb.", "Mar.", "Apr.", "May", "June",
    "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."
  ];
  
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    // Full date: Day Month Year
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return `${day} ${months[month]} ${year}`;
  } else if (parts.length === 2) {
    // Month and year: Month Year
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    return `${months[month]} ${year}`;
  } else if (parts.length === 1) {
    // Just year
    return parts[0];
  }
  
  return dateStr;
}

export function generateJournalMarkdown(entry) {
  let md = "";

  if (entry.openAccess) {
    md += `<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span> `;
  }

  if (entry.journalName) md += `*${entry.journalName}*`;
  if (entry.volume) md += `, Vol. ${entry.volume}`;
  if (entry.issue) md += `, No. ${entry.issue}`;
  if (entry.date) md += ` (${entry.date})`;
  if (entry.theme) md += `: "${entry.theme}"`;
  if (entry.guestEditor) md += `, edited by ${entry.guestEditor}`;
  md += ".  \n";

  if (entry.description) {
    md += `${entry.description}  \n`;
  }

  if (entry.whyItMatters) {
    md += `*${entry.whyItMatters}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) {
    md += `[${entry.urlText || "Link"}](${entry.url})`;
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
  if (entry.description) md += `Description: ${entry.description}  \n`;

  if (entry.whyItMatters) {
    md += `*${entry.whyItMatters}*  \n`;
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
    md += `*${entry.whyItMatters}*  \n`;
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
  if (entry.description) md += `${entry.description}  \n`;

  if (entry.whyItMatters) {
    md += `*${entry.whyItMatters}*  \n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}  \n`;
  }

  if (entry.url) md += `[Watch/Listen](${entry.url})  \n`;
  md += "\n";
  return md;
}