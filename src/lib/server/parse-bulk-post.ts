/**
 * Parse bulk-upload text files with three sections:
 * Tiêu đề / Mô tả ngắn / Nội dung (headings case-insensitive, EN aliases supported).
 */
export interface ParsedBulkPost {
  title: string;
  summarySnippet: string;
  fullContent: string;
}

const TITLE_MARKERS = [/^#\s*tiêu đề\s*$/i, /^tiêu đề\s*:?\s*$/i, /^#\s*title\s*$/i, /^title\s*:?\s*$/i];
const SUMMARY_MARKERS = [
  /^#\s*mô tả ngắn\s*$/i,
  /^mô tả ngắn\s*:?\s*$/i,
  /^#\s*short description\s*$/i,
  /^short description\s*:?\s*$/i,
];
const BODY_MARKERS = [/^#\s*nội dung\s*$/i, /^nội dung\s*:?\s*$/i, /^#\s*content\s*$/i, /^content\s*:?\s*$/i];

function isMarker(line: string, patterns: RegExp[]): boolean {
  const trimmed = line.trim();
  return patterns.some((re) => re.test(trimmed));
}

function markdownToHtmlBlock(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

export function parseBulkPostFile(raw: string, fileName: string): ParsedBulkPost {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let section: "title" | "summary" | "body" | null = null;
  const buckets = { title: [] as string[], summary: [] as string[], body: [] as string[] };

  for (const line of lines) {
    if (isMarker(line, TITLE_MARKERS)) {
      section = "title";
      continue;
    }
    if (isMarker(line, SUMMARY_MARKERS)) {
      section = "summary";
      continue;
    }
    if (isMarker(line, BODY_MARKERS)) {
      section = "body";
      continue;
    }
    if (section) buckets[section].push(line);
  }

  let title = buckets.title.join("\n").trim();
  let summarySnippet = buckets.summary.join("\n").trim();
  let bodyRaw = buckets.body.join("\n").trim();

  // Fallback: no headings — first line title, second summary, rest body
  if (!title && !summarySnippet && !bodyRaw) {
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    title = nonEmpty[0] || fileName.replace(/\.(md|txt)$/i, "");
    summarySnippet = nonEmpty[1] || title;
    bodyRaw = nonEmpty.slice(2).join("\n");
  }

  if (!title) title = fileName.replace(/\.(md|txt)$/i, "");
  if (!summarySnippet) summarySnippet = title;

  return {
    title,
    summarySnippet,
    fullContent: markdownToHtmlBlock(bodyRaw || summarySnippet),
  };
}
