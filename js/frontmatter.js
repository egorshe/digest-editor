export function generateFrontmatter(data, locations) {
  let md = "---\n";
  md += `layout: digest-entry\n`;
  md += `title: "${data.frontmatter.title || "Untitled"}"\n`;
  md += `date: ${data.frontmatter.date || "2025-01-01"}\n`;
  md += `tags: [${data.frontmatter.tags || ""}]\n`;
  md += `draft: ${data.frontmatter.draft || "true"}\n`;

  if (locations.length > 0) {
    md += `locations:\n`;
    locations.forEach((loc) => {
      md += `  - title: "${loc.title}"\n`;
      md += `    city: "${loc.city}"\n`;
      md += `    venue: "${loc.venue}"\n`;
      md += `    coords: ${JSON.stringify(loc.coords)}\n`;
      md += `    country: "${loc.country}"\n`;
      md += `    date: "${loc.date}"\n`;
      md += `    description: "${loc.description}"\n`;
    });
  }

  md += "---\n\n";
  return md;
}

export function collectLocations(sections) {
  const locations = [];
  sections.forEach((section) => {
    section.entries.forEach((entry) => {
      if (["conference", "exhibition", "festival"].includes(entry.type)) {
        const { city, country } = parsePlaceField(entry.place);
        const eventType = getEventTypeLabel(entry); // Pass entry instead of just type

        locations.push({
          title: entry.title ? `${eventType}: ${entry.title}` : eventType,
          city: city,
          venue: entry.venue || "",
          coords: parseCoordinates(entry.coords),
          country: country,
          date: formatEventDate(entry.dateStart, entry.dateEnd),
          description: entry.description || "",
        });
      }
    });
  });
  return locations;
}

function parsePlaceField(place) {
  if (!place) return { city: "", country: "" };
  const parts = place.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], country: parts[parts.length - 1] };
  } else if (parts.length === 1) {
    return { city: parts[0], country: "" };
  }
  return { city: "", country: "" };
}

function formatEventDate(dateStart, dateEnd) {
  if (!dateStart) return "";
  if (!dateEnd || dateStart === dateEnd) return dateStart;
  return `${dateStart} to ${dateEnd}`;
}

function getEventTypeLabel(entry) {
  // Use custom event type if it exists, otherwise use default labels
  if (entry.customEventType) {
    return entry.customEventType;
  }

  const labels = {
    conference: "Conference",
    festival: "Festival",
    exhibition: "Exhibition",
  };
  return labels[entry.type] || "Event";
}
