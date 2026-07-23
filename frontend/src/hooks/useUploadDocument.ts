"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadDocument } from "@/lib/api/documents";
import { documentsQueryKey } from "@/hooks/useDocuments";

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
