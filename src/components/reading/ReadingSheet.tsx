import type { ReactNode } from "react";
import { normalizeTemplate } from "@/lib/reading-templates";

export type ReaderSize = "normal" | "large" | "xlarge";

type ReadingColumnProps = {
  template?: string | null;
  size?: ReaderSize;
  className?: string;
  children: ReactNode;
};

/** Step 2: browser-default reading shell — template/size as data for Step 3. */
export function ReadingColumn({ template, size = "normal", children }: ReadingColumnProps) {
  return (
    <div data-reading-template={normalizeTemplate(template ?? undefined)} data-reader-size={size}>
      {children}
    </div>
  );
}

type ReadingSheetProps = {
  template?: string | null;
  title: string;
  lede?: string | null;
  children: ReactNode;
  className?: string;
};

export function ReadingSheet({ template, title, lede, children }: ReadingSheetProps) {
  return (
    <div>
      <h1>{title}</h1>
      {lede ? <p>{lede}</p> : null}
      <hr />
      <article data-reading-template={normalizeTemplate(template ?? undefined)}>{children}</article>
    </div>
  );
}
