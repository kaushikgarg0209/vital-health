import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EobSummaryCard } from "@/components/health/eob-summary";
import { LabResultsTable } from "@/components/health/lab-results-table";
import { MedicalBillSummaryCard } from "@/components/health/medical-bill-summary";
import { PrescriptionDetails } from "@/components/health/prescription-details";
import type { DocumentExtractedData } from "@/types/extraction";
import type { DocumentType, ProcessingStatus } from "@/types/document";

type DocumentExtractedDataPanelProps = {
  processingStatus: ProcessingStatus;
  documentType: DocumentType | null;
  extractedData: DocumentExtractedData | null;
  notes?: string | null;
  doctorName?: string | null;
  documentDate?: string | null;
};

export function DocumentExtractedDataPanel({
  processingStatus,
  documentType,
  extractedData,
  notes,
  doctorName,
  documentDate,
}: DocumentExtractedDataPanelProps) {
  if (processingStatus === "pending" || processingStatus === "processing") {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardContent className="flex items-center gap-3 py-8">
          <Loader2 className="size-5 animate-spin text-primary-600" />
          <p className="text-sm text-neutral-600">AI is analyzing this document…</p>
        </CardContent>
      </Card>
    );
  }

  if (processingStatus === "failed") {
    return (
      <Card className="border-red-100 shadow-none">
        <CardContent className="py-8">
          <p className="text-sm text-red-600">
            Document processing failed. Try uploading the file again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (extractedData) {
    switch (extractedData.type) {
      case "lab_report":
        return (
          <LabResultsTable
            labReport={extractedData.labReport}
            readings={extractedData.readings}
          />
        );

      case "prescription":
        return (
          <PrescriptionDetails
            medications={extractedData.medications}
            prescribingDoctor={doctorName}
            prescribedDate={documentDate}
          />
        );

      case "medical_bill":
        return (
          <MedicalBillSummaryCard bill={extractedData.bill} lineItems={extractedData.lineItems} />
        );

      case "insurance_eob":
        return <EobSummaryCard eob={extractedData.eob} />;
    }
  }

  if (notes) {
    return (
      <Card className="border-neutral-100 shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-800">
            {documentType === "other" ? "Document summary" : "Extracted summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-neutral-700">{notes}</p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
