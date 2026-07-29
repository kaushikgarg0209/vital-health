"use client";

import { useQuery } from "@tanstack/react-query";
import { searchDocuments } from "@/lib/api/documents";

type SearchDocumentsOptions = {
  type?: string;
  limit?: number;
};

export const searchDocumentsQueryKey = (q: string, options: SearchDocumentsOptions = {}) =>
  ["documents", "search", q, options] as const;

export function useSearchDocuments(q: string, options: SearchDocumentsOptions = {}) {
  return useQuery({
    queryKey: searchDocumentsQueryKey(q, options),
    queryFn: () => searchDocuments(q, options),
    enabled: q.trim().length >= 1,
    staleTime: 0,
    placeholderData: undefined,
  });
}
