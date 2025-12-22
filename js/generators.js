// generators.js - Pure functions that convert entries to markdown
// No DOM, no state mutations, just data → string

export function generatePublicationMarkdown(entry) {
  let md = "";

  if (entry.openAccess) {
    md += `<span style="background-color: #5a96d0; color: white; padding: 0.25em 0.4em; border-radius: 0.25rem; font-size: 75%; line-height: 1;">Open Access</span> `;
  }

  const authors = entry.authors
    .filter((a) => a.surname || a.name)
    .map((a) => `${a.surname}, ${a.name}`)
    .join("; ");
  if (authors) md += `${authors}. `;

  if (entry.pubType === "Book" || entry.pubType === "Thesis") {
    md += `*${entry.title}*`;
  } else {
    md += `"${entry.title}."`;
  }

  if (entry.containerTitle) md += ` *${entry.containerTitle}*`;
  if (entry.volume) md += `, Vol. ${entry.volume}`;
  if (entry.issue) md += `, No. ${entry.issue}`;
  if (entry.publisher) md += `, ${entry.publisher}`;
  if (entry.date) md += `, ${entry.date}`;
  md += ".";

  if (entry.url) md += ` [${entry.urlText || "link"}](${entry.url})`;
  md += "\n";

  if (entry.whyItMatters) {
    md += `*${entry.whyItMatters}*\n`;
  }
  if (entry.signal) {
    md += `**Signal**: ${entry.signal}\n`;
  }

  if (entry.abstract) {
    md += `<details markdown="1"><summary>Abstract</summary>\n${entry.abstract}\n</details>\n`;
  }
  md += "\n";
  return md;
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
