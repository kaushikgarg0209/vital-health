"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/lib/api/documents";
import { isProcessingStatus } from "@/types/document";

export const documentQueryKey = (documentId: string) =>
  ["documents", documentId] as const;

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentQueryKey(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
    refetchInterval: (queryResult) => {
      const status = queryResult.state.data?.processingStatus;

      if (status && isProcessingStatus(status)) {
        return 3000;
      }

      return false;
    },
  });
}
