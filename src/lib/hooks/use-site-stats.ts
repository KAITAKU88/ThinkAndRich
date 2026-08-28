"use client";

import { useEffect, useState } from "react";
import type { PillarType } from "@/lib/types";
import { LANGUAGE_COUNT, PILLAR_COUNT } from "@/lib/site-config";

export interface SiteStats {
  totalPublished: number;
  byPillar: Record<PillarType, number>;
  pillarCount: number;
  languageCount: number;
}

const EMPTY_BY_PILLAR: Record<PillarType, number> = {
  MENTAL_MODEL: 0,
  BUSINESS_STRATEGY: 0,
  STARTUP_IDEA: 0,
};

export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats>({
    totalPublished: 0,
    byPillar: EMPTY_BY_PILLAR,
    pillarCount: PILLAR_COUNT,
    languageCount: LANGUAGE_COUNT,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => res.json() as Promise<{ ok: boolean; stats?: SiteStats }>)
      .then((data) => {
        if (!cancelled && data.ok && data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}
