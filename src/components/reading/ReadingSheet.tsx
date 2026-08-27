import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { normalizeTemplate } from "@/lib/reading-templates";

// The reader's size control feeds one root value rather than Tailwind text-*
// classes: everything on the sheet is sized in em, so a single number
// rescales the whole surface together — title, standfirst, headings, quotes,
// captions and rhythm — instead of resizing body copy while the frame around
// it stays put.
const READER_SIZES = {
  normal: "1.1875rem",
  large: "1.3125rem",
  xlarge: "1.4375rem",
} as const;

export type ReaderSize = keyof typeof READER_SIZES;

type ReadingColumnProps = {
  template?: string | null;
  size?: ReaderSize;
  className?: string;
  children: ReactNode;
};

/**
 * The measured column an article lives in: the sheet, and anything that has
 * to line up with its edges (the rail above it, the tags and related cards
 * below). Its width comes from the template's measure, so choosing a wider
 * layout widens the page itself — see .reading-column in globals.css.
 */
export function ReadingColumn({ template, size = "normal", className, children }: ReadingColumnProps) {
  return (
    <div
      className={cn("reading-column", className)}
      data-reading-template={normalizeTemplate(template ?? undefined)}
      style={{ "--reader-size": READER_SIZES[size] } as CSSProperties}
    >
      {children}
    </div>
  );
}

type ReadingSheetProps = {
  template?: string | null;
  title: string;
  lede?: string | null;
  /** The article body. Rendered inside .prose-academic. */
  children: ReactNode;
  className?: string;
};

/**
 * Title, standfirst and body on one bordered page, sharing one column and
 * one left edge. Nothing else goes between them: anything *about* the
 * article — byline, reading time, view count, badges — belongs on the rail
 * above the sheet, where it is not standing in the reader's way.
 */
export function ReadingSheet({ template, title, lede, children, className }: ReadingSheetProps) {
  return (
    <div className={cn("reading-sheet", className)}>
      <h1>{title}</h1>
      {lede ? <p className="reading-lede">{lede}</p> : null}
      <hr className="reading-divider" />
      {/* The template attribute is repeated here rather than only on the
          column because .prose-academic declares the same tokens on itself,
          and a value declared on an element beats one inherited into it. */}
      <article className="prose-academic" data-reading-template={normalizeTemplate(template ?? undefined)}>
        {children}
      </article>
    </div>
  );
}
