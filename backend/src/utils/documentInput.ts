const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export type DocumentInputPart = {
  inlineData: {
    mimeType: string;
    data: string;
  };
};

export function isSupportedDocumentMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function buildGeminiParts(buffer: Buffer, mimeType: string): DocumentInputPart[] {
  if (!isSupportedDocumentMimeType(mimeType)) {
    throw new Error(`Unsupported mime type for AI processing: ${mimeType}`);
  }

  return [
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
  ];
}
