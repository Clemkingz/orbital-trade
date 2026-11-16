"use client";

/**
 * News adapter (FR-1.5, FR-1.7). In production this hits a server route that caches the
 * licensed news API for 60 s; the client never sees the API key.
 */
import { useCallback, useEffect, useState } from "react";
import { NEWS } from "@orbit/ui/lib/mock/seed";
import type { NewsItem } from "@orbit/ui/lib/types";

export type NewsFilter = "All" | NewsItem["category"];

async function fetchNews(): Promise<NewsItem[]> {
  await new Promise((r) => setTimeout(r, 450)); // simulate network
  return NEWS;
}

export function useNews(refreshMs = 60_000) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await fetchNews());
      setUpdatedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { items, updatedAt, refreshing, reload: load };
}
