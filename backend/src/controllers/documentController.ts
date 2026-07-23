import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { addDocumentJob } from "../queues/producers.js";
import type {
  ListDocumentsQuery,
  SearchDocumentsQuery,
  UpdateDocumentInput,
} from "../schemas/documentSchemas.js";
import {
  DocumentError,
  createDocument,
  deleteDocument,
  getDocumentById,
  listDocuments,
  searchDocuments,
  updateDocument,
} from "../services/documentService.js";
import { toDocumentResponse } from "../types/document.js";
import { deleteFile, getSignedUrl, uploadFile } from "../utils/supabaseStorage.js";
import { sendError, sendPaginatedSuccess, sendSuccess } from "../utils/responseHelpers.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function handleDocumentError(res: Response, error: unknown, context: string): void {
  if (error instanceof DocumentError) {
    sendError(res, error.statusCode, error.message, error.code);
    return;
  }

  console.error(`${context} error:`, error);
  sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    sendError(res, 400, "File is required", "VALIDATION_ERROR");
    return;
  }

  const userId = req.user!.id;
  const documentId = uuidv4();
  let storagePath: string | null = null;

  try {
    storagePath = await uploadFile(userId, documentId, file.buffer, file.mimetype);

    const document = await createDocument({
      id: documentId,
      userId,
      fileName: file.originalname,
      fileMimeType: file.mimetype,
      storagePath,
      fileSizeBytes: file.size,
    });

    let jobId: string;

    try {
      jobId = await addDocumentJob({ documentId: document.id, userId });
    } catch (queueError) {
      console.error("Failed to enqueue document job:", queueError);
      await deleteDocument(userId, document.id);
      await deleteFile(storagePath);
      sendError(res, 503, "Processing queue unavailable", "INTERNAL_ERROR");
      return;
    }

    sendSuccess(res, 202, {
      documentId: document.id,
      jobId,
      status: document.processing_status,
      estimatedProcessingSeconds: 30,
    });
  } catch (error) {
    if (storagePath) {
      try {
        await deleteFile(storagePath);
      } catch (cleanupError) {
        console.error("Failed to clean up storage after upload error:", cleanupError);
      }
    }

    handleDocumentError(res, error, "Upload document");
  }
}

export async function listDocumentsHandler(req: Request, res: Response): Promise<void> {
  try {
    const query = req.validatedQuery as ListDocumentsQuery;
    const result = await listDocuments(req.user!.id, query);

    sendPaginatedSuccess(
      res,
      200,
      result.documents.map(toDocumentResponse),
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.page * result.limit < result.total,
      },
    );
  } catch (error) {
    handleDocumentError(res, error, "List documents");
  }
}

export async function searchDocumentsHandler(req: Request, res: Response): Promise<void> {
  try {
    const query = req.validatedQuery as SearchDocumentsQuery;
    const documents = await searchDocuments(req.user!.id, query);

    sendSuccess(
      res,
      200,
      documents.map((document) => ({
        documentId: document.id,
        fileName: document.file_name,
        documentType: document.document_type,
        processingStatus: document.processing_status,
        documentDate: document.document_date,
        excerpt: document.notes ?? document.file_name,
      })),
    );
  } catch (error) {
    handleDocumentError(res, error, "Search documents");
  }
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  try {
    const document = await getDocumentById(req.user!.id, getRouteParam(req.params.id));

    if (!document) {
      sendError(res, 404, "Document not found", "DOCUMENT_NOT_FOUND");
      return;
    }

    const signedUrl = await getSignedUrl(document.storage_path);

    sendSuccess(res, 200, {
      ...toDocumentResponse(document),
      signedUrl,
    });
  } catch (error) {
    handleDocumentError(res, error, "Get document");
  }
}

export async function patchDocument(req: Request, res: Response): Promise<void> {
  try {
    const document = await updateDocument(
      req.user!.id,
      getRouteParam(req.params.id),
      req.body as UpdateDocumentInput,
    );

    sendSuccess(res, 200, {
      message: "Document updated.",
      document: toDocumentResponse(document),
    });
  } catch (error) {
    handleDocumentError(res, error, "Update document");
  }
}

export async function removeDocument(req: Request, res: Response): Promise<void> {
  try {
    const document = await deleteDocument(req.user!.id, getRouteParam(req.params.id));

    try {
      await deleteFile(document.storage_path);
    } catch (storageError) {
      console.error("Failed to delete storage object:", storageError);
    }

    sendSuccess(res, 200, { message: "Document deleted." });
  } catch (error) {
    handleDocumentError(res, error, "Delete document");
  }
}
