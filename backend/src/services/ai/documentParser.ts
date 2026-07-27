import {
  documentClassificationSchema,
  type DocumentClassification,
} from "../../schemas/ai/documentClassificationSchema.js";
import { genericDocumentExtractionSchema } from "../../schemas/ai/genericDocumentExtractionSchema.js";
import { insuranceEobExtractionSchema } from "../../schemas/ai/insuranceEobExtractionSchema.js";
import { labReportExtractionSchema } from "../../schemas/ai/labReportExtractionSchema.js";
import { medicalBillExtractionSchema } from "../../schemas/ai/medicalBillExtractionSchema.js";
import { prescriptionExtractionSchema } from "../../schemas/ai/prescriptionExtractionSchema.js";
import type { DocumentType } from "../../types/document.js";
import type { DocumentExtractionResult } from "../../types/aiExtraction.js";
import { buildGeminiParts } from "../../utils/documentInput.js";
import { CLASSIFICATION_MODEL, EXTRACTION_MODEL } from "../../config/gemini.js";
import {
  CLASSIFICATION_PROMPT,
  GENERIC_EXTRACTION_PROMPT,
  INSURANCE_EOB_EXTRACTION_PROMPT,
  LAB_REPORT_EXTRACTION_PROMPT,
  MEDICAL_BILL_EXTRACTION_PROMPT,
  PRESCRIPTION_EXTRACTION_PROMPT,
} from "./documentPrompts.js";
import { generateJson } from "./geminiJson.js";

const CLASSIFICATION_SCHEMA_DESCRIPTION = `{ "type": "lab_report|prescription|...", "confidence": 0.0-1.0 }`;

const LAB_REPORT_SCHEMA_DESCRIPTION = `{ reportDate, labName, orderingDoctor, tests: [{ testName, biomarkerKey, value, unit, referenceRangeLow, referenceRangeHigh, status }] }`;

const PRESCRIPTION_SCHEMA_DESCRIPTION = `{ prescribedDate, prescribingDoctor, pharmacyName, medications: [{ medicationName, genericName, dosage, frequency, route, prescribingDoctor, prescribedDate, notes }] }`;

const MEDICAL_BILL_SCHEMA_DESCRIPTION = `{ providerName, serviceDate, totalBilled, insurancePaid, amountDue, dueDate, lineItems: [{ procedureCode, description, serviceDate, billedAmount }] }`;

const EOB_SCHEMA_DESCRIPTION = `{ claimNumber, serviceDate, providerName, billedAmount, insurancePaid, patientResponsibility, denialReason, denialCode, claimStatus, plainLanguageExplanation }`;

const GENERIC_SCHEMA_DESCRIPTION = `{ documentDate, institutionName, doctorName, summary }`;

export async function classifyDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<DocumentClassification> {
  const parts = buildGeminiParts(buffer, mimeType);

  return generateJson(
    CLASSIFICATION_MODEL,
    parts,
    CLASSIFICATION_PROMPT,
    documentClassificationSchema,
    CLASSIFICATION_SCHEMA_DESCRIPTION,
  );
}

export async function extractDocumentData(
  documentType: DocumentType,
  buffer: Buffer,
  mimeType: string,
): Promise<DocumentExtractionResult> {
  const parts = buildGeminiParts(buffer, mimeType);

  switch (documentType) {
    case "lab_report": {
      const data = await generateJson(
        EXTRACTION_MODEL,
        parts,
        LAB_REPORT_EXTRACTION_PROMPT,
        labReportExtractionSchema,
        LAB_REPORT_SCHEMA_DESCRIPTION,
      );

      return { documentType: "lab_report", data };
    }

    case "prescription": {
      const data = await generateJson(
        EXTRACTION_MODEL,
        parts,
        PRESCRIPTION_EXTRACTION_PROMPT,
        prescriptionExtractionSchema,
        PRESCRIPTION_SCHEMA_DESCRIPTION,
      );

      return { documentType: "prescription", data };
    }

    case "medical_bill": {
      const data = await generateJson(
        EXTRACTION_MODEL,
        parts,
        MEDICAL_BILL_EXTRACTION_PROMPT,
        medicalBillExtractionSchema,
        MEDICAL_BILL_SCHEMA_DESCRIPTION,
      );

      return { documentType: "medical_bill", data };
    }

    case "insurance_eob": {
      const data = await generateJson(
        EXTRACTION_MODEL,
        parts,
        INSURANCE_EOB_EXTRACTION_PROMPT,
        insuranceEobExtractionSchema,
        EOB_SCHEMA_DESCRIPTION,
      );

      return { documentType: "insurance_eob", data };
    }

    default: {
      const data = await generateJson(
        EXTRACTION_MODEL,
        parts,
        GENERIC_EXTRACTION_PROMPT,
        genericDocumentExtractionSchema,
        GENERIC_SCHEMA_DESCRIPTION,
      );

      return { documentType, data };
    }
  }
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<{ classification: DocumentClassification; extraction: DocumentExtractionResult }> {
  const classification = await classifyDocument(buffer, mimeType);
  const extraction = await extractDocumentData(classification.type, buffer, mimeType);

  return { classification, extraction };
}
