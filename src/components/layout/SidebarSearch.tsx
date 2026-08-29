"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Post } from "@/lib/types";
import { PILLARS_CONFIG } from "@/lib/data";
import { getTranslation } from "@/lib/i18n/translations";
import { useSession } from "@/store/session";
import { CreditBadge } from "@/components/credits/CreditBadge";

type SidebarSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SidebarSearch({ open, onOpenChange }: SidebarSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/posts?q=${encodeURIComponent(q)}&pageSize=6`)
        .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
        .then((data) => {
          if (data.ok && data.posts) setSearchResults(data.posts);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onOpenChange(false);
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.search.dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearchSubmit}>
          <Search aria-hidden="true" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={t.search.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label={t.search.clearKeywordTooltip}>
              <X aria-hidden="true" />
            </button>
          ) : (
            <span>ESC</span>
          )}
        </form>

        <div>
          {query.trim().length === 0 ? (
            <p>{t.search.emptyPrompt}</p>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((item) => {
                const pillarMeta = PILLARS_CONFIG[item.pillar];
                return (
                  <li key={item.id}>
                    <Link
                      href={`/post/${item.slug || item.id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <span>{pillarMeta?.titleVi}</span>
                      <CreditBadge cost={item.creditCost ?? 0} />
                      <span>{item.title}</span>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>
              {t.search.noResultsPrefix} &quot;{query}&quot;.
            </p>
          )}
        </div>

        {query.trim().length > 0 && searchResults.length > 0 && (
          <div>
            <span>
              {t.search.resultsFoundPrefix} {searchResults.length} {t.search.resultsFoundSuffix}
            </span>
            <button type="button" onClick={handleSearchSubmit}>
              {t.search.viewAllInExplore} →
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Trigger button for sidebar search tool. */
export function SidebarSearchTrigger({ onClick }: { onClick: () => void }) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  return (
    <Button type="button" onClick={onClick} title={t.nav.searchTooltip} aria-label={t.nav.searchTooltip}>
      <Search aria-hidden="true" />
      <span className="app-sidebar-label">{t.nav.searchTooltip}</span>
    </Button>
  );
}
