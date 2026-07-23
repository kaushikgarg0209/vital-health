import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/responseHelpers.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("UNSUPPORTED_FILE_TYPE"));
  },
});

export const singleFileUpload = upload.single("file");

export function uploadSingleFile(req: Request, res: Response, next: NextFunction): void {
  singleFileUpload(req, res, (error) => {
    if (error) {
      handleFileUploadError(error, req, res, next);
      return;
    }

    next();
  });
}

export function handleFileUploadError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!error) {
    next();
    return;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      sendError(res, 413, "File exceeds 20MB limit", "FILE_TOO_LARGE");
      return;
    }

    sendError(res, 400, error.message, "VALIDATION_ERROR");
    return;
  }

  if (error instanceof Error && error.message === "UNSUPPORTED_FILE_TYPE") {
    sendError(res, 415, "Only PDF, JPG, and PNG files are supported", "UNSUPPORTED_FILE_TYPE");
    return;
  }

  next(error);
}
