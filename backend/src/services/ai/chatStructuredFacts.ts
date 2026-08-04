import { supabaseAdmin } from "../../config/supabase.js";
import { detectBiomarkerKeysInText } from "../../utils/biomarkerKey.js";
import type { Profile } from "../../types/profile.js";
import { mapDocument, type DocumentRow } from "../../types/document.js";
import { ChatError } from "../chatService.js";

export type StructuredFactsContext = {
  formatted: string;
  hasData: boolean;
};

type BiomarkerReadingRow = {
  biomarker_key: string;
  biomarker_name: string;
  value: number;
  unit: string;
  reading_date: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  status: string | null;
  lab_report_id: string | null;
};

function detectMedicationTerms(userMessage: string, profile: Profile | null): string[] {
  if (!profile) {
    return [];
  }

  const normalizedMessage = userMessage.toLowerCase();

  return profile.current_medications.filter((medication) => {
    const normalizedMedication = medication.trim().toLowerCase();

    if (normalizedMedication.length < 3) {
      return false;
    }

    return normalizedMessage.includes(normalizedMedication);
  });
}

async function fetchBiomarkerFacts(
  userId: string,
  biomarkerKeys: string[],
): Promise<string[]> {
  if (biomarkerKeys.length === 0) {
    return [];
  }

  const { data: readings, error } = await supabaseAdmin
    .from("biomarker_readings")
    .select(
      "biomarker_key, biomarker_name, value, unit, reading_date, reference_range_low, reference_range_high, status, lab_report_id",
    )
    .eq("user_id", userId)
    .in("biomarker_key", biomarkerKeys)
    .order("reading_date", { ascending: false })
    .limit(20);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!readings || readings.length === 0) {
    return [];
  }

  const labReportIds = [
    ...new Set(
      (readings as BiomarkerReadingRow[])
        .map((reading) => reading.lab_report_id)
        .filter((id): id is string => id != null),
    ),
  ];

  const fileNameByLabReportId = new Map<string, string>();

  if (labReportIds.length > 0) {
    const { data: labReports, error: labReportsError } = await supabaseAdmin
      .from("lab_reports")
      .select("id, document_id")
      .eq("user_id", userId)
      .in("id", labReportIds);

    if (labReportsError) {
      throw new ChatError(labReportsError.message, 500, "INTERNAL_ERROR");
    }

    const documentIds = [
      ...new Set((labReports ?? []).map((report) => report.document_id as string)),
    ];

    if (documentIds.length > 0) {
      const { data: documents, error: documentsError } = await supabaseAdmin
        .from("documents")
        .select("id, file_name")
        .eq("user_id", userId)
        .in("id", documentIds);

      if (documentsError) {
        throw new ChatError(documentsError.message, 500, "INTERNAL_ERROR");
      }

      const fileNameByDocumentId = new Map(
        (documents ?? []).map((row) => {
          const document = mapDocument(row as DocumentRow);
          return [document.id, document.file_name] as const;
        }),
      );

      for (const report of labReports ?? []) {
        const fileName = fileNameByDocumentId.get(report.document_id as string);

        if (fileName) {
          fileNameByLabReportId.set(report.id as string, fileName);
        }
      }
    }
  }

  const grouped = new Map<string, BiomarkerReadingRow[]>();

  for (const reading of readings as BiomarkerReadingRow[]) {
    const existing = grouped.get(reading.biomarker_key) ?? [];
    existing.push(reading);
    grouped.set(reading.biomarker_key, existing);
  }

  const lines: string[] = [];

  for (const [key, keyReadings] of grouped) {
    lines.push(`${key} (${keyReadings.length} reading${keyReadings.length === 1 ? "" : "s"}):`);

    for (const reading of keyReadings) {
      const source = reading.lab_report_id
        ? fileNameByLabReportId.get(reading.lab_report_id)
        : undefined;
      const range =
        reading.reference_range_low != null && reading.reference_range_high != null
          ? `, ref ${reading.reference_range_low}-${reading.reference_range_high} ${reading.unit}`
          : "";
      const status = reading.status ? `, status ${reading.status}` : "";

      lines.push(
        `- ${reading.biomarker_name}: ${reading.value} ${reading.unit} on ${reading.reading_date}${range}${status}${source ? ` (source: ${source})` : ""}`,
      );
    }
  }

  return lines;
}

async function fetchPrescriptionFacts(
  userId: string,
  medicationTerms: string[],
): Promise<string[]> {
  if (medicationTerms.length === 0) {
    return [];
  }

  const filters = medicationTerms.map(
    (medication) => `medication_name.ilike.%${medication.replace(/,/g, " ")}%`,
  );

  const { data: prescriptions, error } = await supabaseAdmin
    .from("prescriptions")
    .select("medication_name, dosage, frequency, document_id")
    .eq("user_id", userId)
    .or(filters.join(","))
    .limit(10);

  if (error) {
    throw new ChatError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!prescriptions || prescriptions.length === 0) {
    return [];
  }

  const documentIds = [
    ...new Set(
      prescriptions
        .map((prescription) => prescription.document_id as string | null)
        .filter((id): id is string => id != null),
    ),
  ];

  const fileNameByDocumentId = new Map<string, string>();

  if (documentIds.length > 0) {
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from("documents")
      .select("id, file_name")
      .eq("user_id", userId)
      .in("id", documentIds);

    if (documentsError) {
      throw new ChatError(documentsError.message, 500, "INTERNAL_ERROR");
    }

    for (const row of documents ?? []) {
      const document = mapDocument(row as DocumentRow);
      fileNameByDocumentId.set(document.id, document.file_name);
    }
  }

  return prescriptions.map((prescription) => {
    const source = prescription.document_id
      ? fileNameByDocumentId.get(prescription.document_id as string)
      : undefined;
    const dosage = prescription.dosage ? ` ${prescription.dosage}` : "";
    const frequency = prescription.frequency ? `, ${prescription.frequency}` : "";

    return `- ${prescription.medication_name}${dosage}${frequency}${source ? ` (source: ${source})` : ""}`;
  });
}

export async function fetchStructuredFacts(
  userId: string,
  userMessage: string,
  profile: Profile | null,
  extraTexts: string[] = [],
): Promise<StructuredFactsContext> {
  const biomarkerKeys = new Set(detectBiomarkerKeysInText(userMessage));

  for (const text of extraTexts) {
    for (const key of detectBiomarkerKeysInText(text)) {
      biomarkerKeys.add(key);
    }
  }

  const medicationTerms = detectMedicationTerms(userMessage, profile);

  const [biomarkerLines, prescriptionLines] = await Promise.all([
    fetchBiomarkerFacts(userId, [...biomarkerKeys]),
    fetchPrescriptionFacts(userId, medicationTerms),
  ]);

  const sections: string[] = [];

  if (biomarkerLines.length > 0) {
    sections.push("Biomarker readings:", ...biomarkerLines);
  }

  if (prescriptionLines.length > 0) {
    sections.push("Prescriptions:", ...prescriptionLines);
  }

  if (sections.length === 0) {
    return {
      formatted: "No structured extracted data matched this question.",
      hasData: false,
    };
  }

  return {
    formatted: sections.join("\n"),
    hasData: true,
  };
}
