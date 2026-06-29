"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
} from "@/services/api";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/services/api/client";

const DOCUMENTS_KEY = ["documents"];

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: listDocuments,
    retry: 0,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: (data) => {
      toast.success(`Uploaded document (${data.chunks} chunks)`);
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Upload failed";
      toast.error(message);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
    onError: (error) => {
      const message = isApiError(error) ? error.message : "Delete failed";
      toast.error(message);
    },
  });
}
