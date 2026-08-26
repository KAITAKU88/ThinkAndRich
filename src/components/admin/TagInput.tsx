"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  MAX_TAGS_PER_POST,
  addTag,
  parseTagList,
  removeTag,
  suggestTags,
} from "@/lib/tags";
import { cn } from "@/lib/utils";

/**
 * Keyword tags for an article.
 *
 * Readers see these on the article page, and the MCP authoring tools have
 * always been able to set them — but the console's editor had no field, so
 * anything written by hand came out untagged while AI-written posts did not.
 *
 * The suggestion list is the part that matters. Tags are free text, and free
 * text typed twice becomes "Ra quyết định" and "Ra Quyết Định" living side
 * by side; showing what already exists is what stops that. The rules
 * themselves are in src/lib/tags.ts, where they can be tested.
 */

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Every tag already used across the library, for suggestions. */
  knownTags: string[];
}

export function TagInput({ tags, onChange, knownTags }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => (focused ? suggestTags(knownTags, draft, tags, 6) : []),
    [focused, knownTags, draft, tags]
  );

  const full = tags.length >= MAX_TAGS_PER_POST;

  function commit(candidate: string) {
    const result = addTag(tags, candidate);
    if (result.rejected === "DUPLICATE") setNotice("Nhãn này đã có trong bài.");
    else if (result.rejected === "TOO_MANY") setNotice(`Tối đa ${MAX_TAGS_PER_POST} nhãn mỗi bài.`);
    else setNotice(null);

    if (!result.rejected) {
      onChange(result.tags);
      setDraft("");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      return;
    }
    // Backspace on an empty field removes the last chip, which is what every
    // other tag field does and what fingers expect.
    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(removeTag(tags, tags.length - 1));
      setNotice(null);
    }
  }

  // A pasted list is the one moment several tags arrive at once.
  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!/[,;\n]/.test(pasted)) return;

    event.preventDefault();
    let next = tags;
    for (const candidate of parseTagList(pasted)) {
      const result = addTag(next, candidate);
      next = result.tags;
    }
    onChange(next);
    setDraft("");
    setNotice(next.length >= MAX_TAGS_PER_POST ? `Tối đa ${MAX_TAGS_PER_POST} nhãn mỗi bài.` : null);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium">Nhãn từ khóa</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {tags.length}/{MAX_TAGS_PER_POST}
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 min-h-9 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            data-testid="tag-chip"
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium"
          >
            {tag}
            <button
              type="button"
              aria-label={`Xoá nhãn ${tag}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange(removeTag(tags, index));
                setNotice(null);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          data-testid="tag-input"
          value={draft}
          disabled={full}
          onChange={(e) => {
            setDraft(e.target.value);
            setNotice(null);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          // Delayed so a click on a suggestion lands before the list closes.
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={full ? "" : tags.length === 0 ? "Gõ rồi Enter…" : ""}
          className="flex-1 min-w-[7rem] bg-transparent text-xs outline-none disabled:cursor-not-allowed"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1" data-testid="tag-suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commit(tag)}
              className="rounded-md border border-dashed border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      <p className={cn("text-[11px]", notice ? "text-destructive" : "text-muted-foreground")}>
        {notice ?? "Hiện dưới bài viết. Chọn lại nhãn có sẵn thay vì tạo nhãn gần giống."}
      </p>
    </div>
  );
}
