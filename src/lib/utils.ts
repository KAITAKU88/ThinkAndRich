export function formatViews(n: number): string {
  return n.toLocaleString("vi-VN");
}

/**
 * academicFormula is authored as raw LaTeX source (\text{}, \sum, \implies...)
 * but the site has no KaTeX/MathJax renderer wired in, so it was showing up
 * verbatim as escaped LaTeX ("\text{Margin} = \text{...") instead of a
 * readable formula. This is a lightweight normalizer — not a LaTeX parser —
 * that strips the handful of commands actually used in this content into
 * plain Unicode math notation, matching the mono/technical treatment the
 * formula already gets everywhere it's displayed.
 */
export function formatFormula(raw: string): string {
  let out = raw;

  // Grouping commands: \text{x}, \mathcal{x}, \mathbf{x} -> x
  // (looped so nested cases like \tau_{\text{net}} fully resolve inward-out)
  let prev: string;
  do {
    prev = out;
    out = out.replace(/\\(?:text|mathcal|mathbf|mathrm)\{([^{}]*)\}/g, "$1");
  } while (out !== prev);
  // Thousands-separator trick: 45{,}000 -> 45,000
  out = out.replace(/\{,\}/g, ",");
  // Strip braces used purely for sub/superscript grouping: _{i} -> _i
  out = out.replace(/([_^])\{([^{}]+)\}/g, "$1$2");
  // \frac{a}{b} -> (a)/(b); must run after the above so a/b are brace-free
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");

  const symbols: [RegExp, string][] = [
    [/\\sum/g, "Σ"],
    [/\\int/g, "∫"],
    [/\\Delta/g, "Δ"],
    [/\\tau/g, "τ"],
    [/\\omega/g, "ω"],
    [/\\implies/g, "⟹"],
    [/\\iff/g, "⟺"],
    [/\\forall/g, "∀"],
    [/\\in/g, "∈"],
    [/\\cap/g, "∩"],
    [/\\times/g, "×"],
    [/\\ge/g, "≥"],
    [/\\le/g, "≤"],
    [/\\gg/g, "≫"],
    [/\\ll/g, "≪"],
    [/\\max/g, "max"],
    [/\\min/g, "min"],
    [/\\quad/g, "  "],
    [/\\,/g, " "],
    [/\\&/g, "&"],
    [/\\\$/g, "$"],
  ];
  for (const [pattern, replacement] of symbols) {
    out = out.replace(pattern, replacement);
  }

  // Fallback: drop the backslash off any leftover unrecognized command
  // (e.g. \frac, \omega) so it degrades to the bare word/letters instead
  // of visible LaTeX syntax.
  out = out.replace(/\\([a-zA-Z]+)/g, "$1");
  // Any braces left over at this point were pure grouping — drop them.
  out = out.replace(/[{}]/g, "");

  return out.replace(/\s+/g, " ").trim();
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "1 ngày trước";
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
}
