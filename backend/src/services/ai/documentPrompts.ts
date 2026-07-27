export const CLASSIFICATION_PROMPT = `You are analyzing a medical document image or PDF.
Classify it into exactly one of these types:
lab_report, prescription, discharge_summary, imaging_report, medical_bill, insurance_eob, insurance_policy, vaccination_record, other

Return ONLY valid JSON with this shape:
{ "type": "<one of the types above>", "confidence": <number between 0 and 1> }

Use confidence 0.9+ when clearly identifiable, 0.5-0.8 when uncertain, below 0.5 for "other".
If the document has multiple pages, focus on the first 5 pages.`;

export const LAB_REPORT_EXTRACTION_PROMPT = `Extract structured data from this lab report.
Return ONLY valid JSON matching:
{
  "reportDate": "YYYY-MM-DD or null",
  "labName": "string or null",
  "orderingDoctor": "string or null",
  "tests": [
    {
      "testName": "string",
      "biomarkerKey": "standardized snake_case key or null (e.g. ldl_cholesterol, hba1c, glucose, hdl_cholesterol, total_cholesterol, triglycerides, creatinine, tsh, vitamin_d)",
      "value": "string or number or null",
      "unit": "string or null",
      "referenceRangeLow": number or null,
      "referenceRangeHigh": number or null,
      "status": "normal|borderline|concerning|critical|unknown"
    }
  ]
}
Include every test result visible. Use null for missing fields. Focus on the first 5 pages if long.`;

export const PRESCRIPTION_EXTRACTION_PROMPT = `Extract structured data from this prescription document.
Return ONLY valid JSON matching:
{
  "prescribedDate": "YYYY-MM-DD or null",
  "prescribingDoctor": "string or null",
  "pharmacyName": "string or null",
  "medications": [
    {
      "medicationName": "string",
      "genericName": "string or null",
      "dosage": "string or null",
      "frequency": "string or null",
      "route": "string or null",
      "prescribingDoctor": "string or null",
      "prescribedDate": "YYYY-MM-DD or null",
      "notes": "string or null"
    }
  ]
}`;

export const MEDICAL_BILL_EXTRACTION_PROMPT = `Extract structured data from this medical bill.
Return ONLY valid JSON matching:
{
  "providerName": "string or null",
  "serviceDate": "YYYY-MM-DD or null",
  "totalBilled": number or null,
  "insurancePaid": number or null,
  "amountDue": number or null,
  "dueDate": "YYYY-MM-DD or null",
  "lineItems": [
    {
      "procedureCode": "string or null",
      "description": "string or null",
      "serviceDate": "YYYY-MM-DD or null",
      "billedAmount": number or null
    }
  ]
}`;

export const INSURANCE_EOB_EXTRACTION_PROMPT = `Extract structured data from this insurance Explanation of Benefits (EOB).
Return ONLY valid JSON matching:
{
  "claimNumber": "string or null",
  "serviceDate": "YYYY-MM-DD or null",
  "providerName": "string or null",
  "billedAmount": number or null,
  "insurancePaid": number or null,
  "patientResponsibility": number or null,
  "denialReason": "string or null",
  "denialCode": "string or null",
  "claimStatus": "approved|partially_approved|denied|pending|appealed or null",
  "plainLanguageExplanation": "brief plain-language summary or null"
}`;

export const GENERIC_EXTRACTION_PROMPT = `Extract basic metadata from this medical document.
Return ONLY valid JSON matching:
{
  "documentDate": "YYYY-MM-DD or null",
  "institutionName": "string or null",
  "doctorName": "string or null",
  "summary": "one-paragraph plain-language summary or null"
}`;

export const JSON_CORRECTION_PROMPT = (schemaDescription: string, errorMessage: string) =>
  `Your previous response was invalid JSON or did not match the required schema.
Error: ${errorMessage}
Return ONLY valid JSON matching this schema:
${schemaDescription}
Do not include markdown, code fences, or explanation text.`;
