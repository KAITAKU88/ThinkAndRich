/**
 * Rules for article tags.
 *
 * Tags were writable through the MCP authoring tools and shown to readers,
 * but the console's own editor had no field for them — it silently carried
 * whatever was already on the post. So 62 of 83 articles had tags and
 * nothing written by hand could ever get one.
 *
 * The rules live here, apart from the input component, because the thing
 * worth getting right is not the chips — it is that "Ra quyết định" typed
 * twice does not become two tags.
 */

export const MAX_TAG_LENGTH = 40;
export const MAX_TAGS_PER_POST = 8;

/**
 * Collapse a tag to its comparison form.
 *
 * Case and inner spacing are noise; Vietnamese diacritics are not, so they
 * are left alone. "Ra  Quyết Định " and "ra quyết định" are the same tag;
 * "Ra quyet dinh" is a different one, and deliberately so — stripping tone
 * marks would merge words that genuinely differ in Vietnamese.
 */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

/** The form a tag is stored and displayed in: trimmed, inner spacing collapsed. */
export function cleanTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

export type TagRejection = "EMPTY" | "DUPLICATE" | "TOO_MANY";

/**
 * Add a tag to a list, or say why not.
 *
 * Returns the list unchanged on rejection rather than throwing: the caller
 * is a text field reacting to a keystroke, and a rejected tag is an ordinary
 * outcome there, not an error.
 */
export function addTag(
  existing: readonly string[],
  candidate: string
): { tags: string[]; rejected?: TagRejection } {
  const cleaned = cleanTag(candidate);
  if (!cleaned) return { tags: [...existing], rejected: "EMPTY" };

  if (existing.some((tag) => normalizeTag(tag) === normalizeTag(cleaned))) {
    return { tags: [...existing], rejected: "DUPLICATE" };
  }
  if (existing.length >= MAX_TAGS_PER_POST) {
    return { tags: [...existing], rejected: "TOO_MANY" };
  }

  return { tags: [...existing, cleaned] };
}

export function removeTag(existing: readonly string[], index: number): string[] {
  return existing.filter((_, i) => i !== index);
}

/**
 * Split what someone pasted into separate tags.
 *
 * People paste comma-separated lists, and a paste is the one moment where
 * several tags arrive at once. Newlines and semicolons count too, since a
 * list copied out of a document rarely uses only commas.
 */
export function parseTagList(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map(cleanTag)
    .filter(Boolean);
}

/**
 * Existing tags that match what is being typed and are not already on the
 * post — the point being to reuse a tag rather than coin a near-duplicate.
 */
export function suggestTags(
  allTags: readonly string[],
  query: string,
  alreadyOn: readonly string[],
  limit = 8
): string[] {
  const needle = normalizeTag(query);
  const taken = new Set(alreadyOn.map(normalizeTag));

  const matches = allTags.filter((tag) => {
    const normalized = normalizeTag(tag);
    if (taken.has(normalized)) return false;
    return needle === "" || normalized.includes(needle);
  });

  // Tags that start with what was typed are the ones being reached for.
  matches.sort((a, b) => {
    const aStarts = normalizeTag(a).startsWith(needle) ? 0 : 1;
    const bStarts = normalizeTag(b).startsWith(needle) ? 0 : 1;
    return aStarts - bStarts || a.localeCompare(b, "vi");
  });

  return matches.slice(0, limit);
}
