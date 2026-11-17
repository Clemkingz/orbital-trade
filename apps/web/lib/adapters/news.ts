"use client";

/**
 * News adapter (FR-1.5, FR-1.7). Real headlines from public publisher feeds, served by the
 * web app's own route (app/feeds/news/route.ts) and refreshed every 60 s. One shared request
 * feeds both the headline ticker and the Market news section.
 */
import useSWR from "swr";
import type { NewsItem } from "@orbit/ui/lib/types";

export type NewsFilter = "All" | NewsItem["category"];

interface NewsResponse {
  items: NewsItem[];
  updatedAt: string;
  error?: string;
}

async function fetchNews(url: string): Promise<NewsResponse> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as NewsResponse | null;
  if (!res.ok || !body) throw new Error(body?.error ?? "Couldn't load headlines.");
  return body;
}

export function useNews(refreshMs = 60_000) {
  const { data, error, isValidating, mutate } = useSWR<NewsResponse, Error>("/feeds/news", fetchNews, {
    refreshInterval: refreshMs,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return {
    items: data?.items ?? (error ? [] : null),
    updatedAt: data ? new Date(data.updatedAt) : null,
    refreshing: isValidating,
    error: error?.message ?? null,
    reload: () => mutate(),
  };
}
