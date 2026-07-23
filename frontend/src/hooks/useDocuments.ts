"use client";

import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/lib/api/documents";
import type { ListDocumentsQuery } from "@/types/document";
import { isProcessingStatus } from "@/types/document";

export const documentsQueryKey = (query: ListDocumentsQuery = {}) =>
  ["documents", query] as const;

export function useDocuments(query: ListDocumentsQuery = {}) {
  return useQuery({
    queryKey: documentsQueryKey(query),
    queryFn: () => listDocuments(query),
    refetchInterval: (queryResult) => {
      const documents = queryResult.state.data?.documents ?? [];
      const hasProcessing = documents.some((document) =>
        isProcessingStatus(document.processingStatus),
      );

      return hasProcessing ? 3000 : false;
    },
  });
}
