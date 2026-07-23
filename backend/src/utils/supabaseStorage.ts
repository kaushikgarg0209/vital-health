import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";

export const HEALTH_DOCUMENTS_BUCKET = "health-documents";

const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function extensionFromMime(mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType];

  if (!extension) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  return extension;
}

export function buildStoragePath(
  userId: string,
  documentId: string,
  mimeType: string,
): string {
  const extension = extensionFromMime(mimeType);
  return `${userId}/${documentId}.${extension}`;
}

export async function uploadFile(
  userId: string,
  documentId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const storagePath = buildStoragePath(userId, documentId, mimeType);

  const { error } = await supabaseAdmin.storage
    .from(HEALTH_DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return storagePath;
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(HEALTH_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, env.SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to create signed URL");
  }

  return data.signedUrl;
}

export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(HEALTH_DOCUMENTS_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
}
