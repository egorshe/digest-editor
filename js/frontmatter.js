export function yamlEscape(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n+/g, " ")
    .trim();
}

export function generateFrontmatter(frontmatter, locations = []) {
  let md = "---\n";

  md += `layout: digest-entry\n`;
  md += `title: "${yamlEscape(frontmatter.title || "Untitled")}"\n`;
  md += `date: "${frontmatter.date || "2025-01-01"}"\n`;

  // Normalize tags
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map((t) => `"${yamlEscape(t)}"`).join(", ")
    : "";
  md += `tags: [${tags}]\n`;

  md += `draft: ${frontmatter.draft ?? true}\n`;

  // Locations (only if present)
  if (locations.length) {
    md += "locations:\n";
    locations.forEach((loc) => {
      md += `  - title: "${yamlEscape(loc.title)}"\n`;
      md += `    city: "${yamlEscape(loc.city)}"\n`;
      md += `    venue: "${yamlEscape(loc.venue)}"\n`;
      md += `    country: "${yamlEscape(loc.country)}"\n`;
      md += `    date: "${yamlEscape(loc.date)}"\n`;
      md += `    coords: [${(loc.coords || []).join(", ")}]\n`;
      md += `    description: "${yamlEscape(loc.description)}"\n`;
    });
  }

  md += "---\n\n";
  return md;
}

export function collectLocations(sections, frontmatterLocations = []) {
  const locations = [];

  sections.forEach((section) => {
    (section.entries || []).forEach((entry) => {
      if (!["conference", "festival", "exhibition"].includes(entry.type))
        return;

      const { city, country } = parsePlaceField(entry.place);

      const typeLabel =
        entry.customEventType ||
        entry.type.charAt(0).toUpperCase() + entry.type.slice(1);

      const entryTitle = entry.title || "Untitled";

      // Check if there's a frontmatter override for this entry
      const frontmatterOverride = frontmatterLocations.find(
        (loc) => loc.entryId === entry.id,
      );

      if (frontmatterOverride) {
        locations.push({
          title: frontmatterOverride.title || `${typeLabel}: ${entryTitle}`,
          city,
          venue: entry.venue || "",
          country,
          coords: parseCoordinates(entry.coords),
          date: formatEventDate(entry.dateStart, entry.dateEnd),
          description:
            frontmatterOverride.description || entry.description || "",
          entryId: entry.id,
        });
      } else {
        locations.push({
          title: `${typeLabel}: ${entryTitle}`,
          city,
          venue: entry.venue || "",
          country,
          coords: parseCoordinates(entry.coords),
          date: formatEventDate(entry.dateStart, entry.dateEnd),
          description: entry.description || "",
          entryId: entry.id,
        });
      }
    });
  });

  return locations;
}

function parseCoordinates(coords) {
  return coords
    ? coords
        .split(",")
        .map((c) => parseFloat(c.trim()))
        .filter((n) => !isNaN(n))
    : [];
}

function parsePlaceField(place) {
  if (!place) return { city: "", country: "" };
  const parts = place.split(",").map((p) => p.trim());
  return parts.length >= 2
    ? { city: parts[0], country: parts[parts.length - 1] }
    : { city: parts[0], country: "" };
}

function formatEventDate(start, end) {
  if (!start) return "";
  return !end || start === end ? start : `${start} to ${end}`;
}
