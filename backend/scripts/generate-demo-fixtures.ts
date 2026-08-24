import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testdataDir = path.resolve(__dirname, "../testdata");
const dataPath = path.join(testdataDir, "demo-patient.json");

type LabValue = {
  value: number;
  flag: string;
};

type Biomarker = {
  biomarkerKey: string;
  testName: string;
  alias: string;
  category: string;
  unit: string;
  referenceLow: number | null;
  referenceHigh: number | null;
  baseline: LabValue;
  followUp: LabValue;
};

type LabReportMeta = {
  reportDate: string;
  collectionDate: string;
  collectionTime: string;
  reportTime: string;
  fasting: boolean;
  accessionNumber: string;
  specimenId: string;
  fileName: string;
};

type Medication = {
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  quantity: string;
  refills: number;
  notes: string;
};

type DemoData = {
  patient: {
    name: string;
    dob: string;
    sex: string;
    mrn: string;
    address: string;
    phone: string;
  };
  providers: {
    orderingPhysician: string;
    specialty: string;
    clinic: string;
    clinicAddress: string;
    clinicPhone: string;
    npi: string;
    labName: string;
    labAddress: string;
    labDirector: string;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
  };
  labReports: {
    baseline: LabReportMeta;
    followUp: LabReportMeta;
  };
  biomarkers: Biomarker[];
  prescription: {
    prescribedDate: string;
    fileName: string;
    clinicalNote: string;
    medications: Medication[];
  };
};

function formatReference(low: number | null, high: number | null, unit: string): string {
  if (low !== null && high !== null) {
    return `${low} - ${high} ${unit}`;
  }
  if (low !== null) {
    return `>= ${low} ${unit}`;
  }
  if (high !== null) {
    return `<= ${high} ${unit}`;
  }
  return unit;
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function groupByCategory(biomarkers: Biomarker[]): Map<string, Biomarker[]> {
  const groups = new Map<string, Biomarker[]>();

  for (const biomarker of biomarkers) {
    const list = groups.get(biomarker.category) ?? [];
    list.push(biomarker);
    groups.set(biomarker.category, list);
  }

  return groups;
}

function writePdf(filePath: string, build: (doc: PDFKit.PDFDocument) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48, autoFirstPage: true });
    const stream = fs.createWriteStream(filePath);
    let pageCount = 0;

    doc.on("pageAdded", () => {
      pageCount += 1;
    });

    stream.on("finish", () => resolve(pageCount));
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);
    build(doc);
    doc.end();
  });
}

function drawLabHeader(doc: PDFKit.PDFDocument, data: DemoData, report: LabReportMeta): void {
  const { patient, providers } = data;

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#1e3a5f")
    .text(providers.labName, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#444444")
    .text(providers.labAddress, { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111111")
    .text("COMPREHENSIVE METABOLIC & WELLNESS PANEL", { align: "center" })
    .moveDown(0.75);

  doc.fontSize(9).font("Helvetica");

  const leftX = 48;
  const rightX = 320;
  let y = doc.y;

  const leftRows: [string, string][] = [
    ["Patient Name", patient.name],
    ["Date of Birth", patient.dob],
    ["Sex", patient.sex],
    ["MRN", patient.mrn],
    ["Phone", patient.phone],
  ];

  const rightRows: [string, string][] = [
    ["Accession #", report.accessionNumber],
    ["Specimen ID", report.specimenId],
    ["Collection", `${report.collectionDate} ${report.collectionTime}`],
    ["Report Date", `${report.reportDate} ${report.reportTime}`],
    ["Fasting", report.fasting ? "Yes (12 hours)" : "No"],
  ];

  for (let i = 0; i < leftRows.length; i += 1) {
    doc.font("Helvetica-Bold").text(leftRows[i][0] + ":", leftX, y, { width: 110, continued: false });
    doc.font("Helvetica").text(leftRows[i][1], leftX + 112, y, { width: 150 });
    doc.font("Helvetica-Bold").text(rightRows[i][0] + ":", rightX, y, { width: 90, continued: false });
    doc.font("Helvetica").text(rightRows[i][1], rightX + 92, y, { width: 200 });
    y += 14;
  }

  doc.y = y + 8;
  doc
    .font("Helvetica")
    .text(`Ordering Physician: ${providers.orderingPhysician} — ${providers.specialty}`)
    .text(`Clinic: ${providers.clinic}`)
    .moveDown(0.75);

  doc
    .moveTo(48, doc.y)
    .lineTo(564, doc.y)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(10).text("Clinical Indication");
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Annual wellness examination with comprehensive metabolic screening. Patient reports family history of hyperlipidemia and prediabetes. Prior lipid panel (2024) showed LDL 128 mg/dL. No acute symptoms. Medications reviewed at ordering visit.",
      { width: 500 },
    )
    .moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(10).text("Specimen Information");
  doc.font("Helvetica").fontSize(9);
  doc.text(`Primary tube: SST serum separator, gold top — Quantity: 2`);
  doc.text(`Secondary tube: EDTA whole blood, lavender top — Quantity: 1`);
  doc.text(`Transport: Room temperature, delivered to lab within 2 hours`);
  doc.moveDown(0.5);
}

function drawPanelTable(
  doc: PDFKit.PDFDocument,
  category: string,
  rows: Biomarker[],
  valueKey: "baseline" | "followUp",
): void {
  const startY = doc.y;

  if (startY > 640) {
    doc.addPage();
  }

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1e3a5f").text(category).moveDown(0.25);

  const colX = {
    test: 48,
    result: 280,
    flag: 340,
    reference: 380,
    unit: 500,
  };

  let y = doc.y;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#666666");
  doc.text("Test", colX.test, y);
  doc.text("Result", colX.result, y);
  doc.text("Flag", colX.flag, y);
  doc.text("Reference Interval", colX.reference, y);
  doc.text("Unit", colX.unit, y);

  y += 14;
  doc.moveTo(48, y).lineTo(564, y).strokeColor("#dddddd").stroke();
  y += 6;

  doc.font("Helvetica").fontSize(8.5).fillColor("#111111");

  for (const row of rows) {
    if (y > 700) {
      doc.addPage();
      y = 48;
    }

    const value = row[valueKey];
    const testLabel = `${row.testName} (${row.alias})`;

    doc.text(testLabel, colX.test, y, { width: 225 });
    doc.text(formatValue(value.value), colX.result, y, { width: 50 });
    doc.fillColor(value.flag === "H" ? "#b45309" : value.flag === "L" ? "#1d4ed8" : "#111111");
    doc.text(value.flag || "—", colX.flag, y, { width: 30 });
    doc.fillColor("#111111");
    doc.text(formatReference(row.referenceLow, row.referenceHigh, row.unit), colX.reference, y, {
      width: 115,
    });
    doc.text(row.unit, colX.unit, y, { width: 60 });

    y += 16;
  }

  doc.y = y + 10;
}

function drawLabFooter(doc: PDFKit.PDFDocument, data: DemoData): void {
  doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#1e3a5f")
    .text("Laboratory Notes & Methodology")
    .moveDown(0.5);

  doc.font("Helvetica").fontSize(9).fillColor("#333333");
  const notes = [
    "Specimens were collected via venipuncture and processed within 4 hours of collection.",
    "Lipid panel, glucose, and insulin assays performed on serum after centrifugation at 3400 RPM for 10 minutes.",
    "HbA1c measured by high-performance liquid chromatography (HPLC).",
    "Thyroid panel by chemiluminescent immunoassay. CBC performed on whole blood with automated cell counter.",
    "Vitamin D (25-OH) measured by LC-MS/MS. CRP by high-sensitivity nephelometry.",
    "Reference intervals reflect adult male population unless otherwise noted. Flag H = above reference, L = below reference.",
    "Results should be interpreted in clinical context. This report is for demonstration purposes only.",
    "Fictional patient and facility data — not a real medical record.",
  ];

  for (const note of notes) {
    doc.text(`• ${note}`, { width: 500 }).moveDown(0.35);
  }

  doc.moveDown(1.5);
  doc
    .font("Helvetica-Bold")
    .text("Laboratory Director")
    .font("Helvetica")
    .text(data.providers.labDirector)
    .moveDown(0.5)
    .text("Electronically signed")
    .text(`Report generated: ${new Date().toISOString().slice(0, 10)}`);
}

function generateLabReport(
  data: DemoData,
  reportKey: "baseline" | "followUp",
  valueKey: "baseline" | "followUp",
): Promise<{ filePath: string; pageCount: number }> {
  const report = data.labReports[reportKey];
  const filePath = path.join(testdataDir, report.fileName);
  const categories = groupByCategory(data.biomarkers);
  const categoryOrder = [
    "Lipid Panel",
    "Blood Sugar",
    "Kidney",
    "Liver",
    "Thyroid",
    "Complete Blood Count",
    "Vitamins & Minerals",
    "Inflammation",
    "Electrolytes",
  ];

  return writePdf(filePath, (doc) => {
    drawLabHeader(doc, data, report);
    doc.addPage();

    const pageBreakAfter = new Set(["Blood Sugar", "Liver", "Vitamins & Minerals"]);

    for (const category of categoryOrder) {
      const rows = categories.get(category);
      if (!rows?.length) {
        continue;
      }

      drawPanelTable(doc, category, rows, valueKey);

      if (pageBreakAfter.has(category)) {
        doc.addPage();
      }
    }

    drawLabFooter(doc, data);
  }).then((pageCount) => ({ filePath, pageCount }));
}

function generatePrescription(data: DemoData): Promise<{ filePath: string; pageCount: number }> {
  const { patient, providers, prescription } = data;
  const filePath = path.join(testdataDir, prescription.fileName);

  return writePdf(filePath, (doc) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#1e3a5f")
      .text(providers.clinic, { align: "center" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#444444")
      .text(providers.clinicAddress, { align: "center" })
      .text(`Phone: ${providers.clinicPhone}`, { align: "center" })
      .moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111111")
      .text("PRESCRIPTION / MEDICATION ORDER")
      .moveDown(0.75);

    doc.font("Helvetica").fontSize(9);
    doc.text(`Date: ${prescription.prescribedDate}`);
    doc.text(`Prescriber: ${providers.orderingPhysician}`);
    doc.text(`Specialty: ${providers.specialty}`);
    doc.text(`NPI: ${providers.npi}`);
    doc.moveDown(0.75);

    doc.font("Helvetica-Bold").text("Patient Information");
    doc.font("Helvetica");
    doc.text(`Name: ${patient.name}`);
    doc.text(`DOB: ${patient.dob}`);
    doc.text(`Sex: ${patient.sex}`);
    doc.text(`MRN: ${patient.mrn}`);
    doc.text(`Address: ${patient.address}`);
    doc.text(`Phone: ${patient.phone}`);
    doc.moveDown(0.75);

    doc.font("Helvetica-Bold").text("Pharmacy");
    doc.font("Helvetica");
    doc.text(providers.pharmacyName);
    doc.text(providers.pharmacyAddress);
    doc.text(`Phone: ${providers.pharmacyPhone}`);
    doc.moveDown(0.75);

    doc
      .moveTo(48, doc.y)
      .lineTo(564, doc.y)
      .strokeColor("#cccccc")
      .stroke()
      .moveDown(0.75);

    doc.font("Helvetica-Bold").fontSize(10).text("Medications");
    doc.moveDown(0.5);

    prescription.medications.forEach((med, index) => {
      if (index === 3) {
        doc.addPage();
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111111")
        .text(`${index + 1}. ${med.medicationName} (${med.genericName})`);

      doc.font("Helvetica").fontSize(9).fillColor("#333333");
      doc.text(`Dosage: ${med.dosage}`);
      doc.text(`Sig: ${med.frequency}`);
      doc.text(`Route: ${med.route}`);
      doc.text(`Quantity: ${med.quantity} | Refills: ${med.refills}`);
      doc.text(`Notes: ${med.notes}`);
      doc.moveDown(0.6);
    });

    doc.addPage();

    doc.font("Helvetica-Bold").fontSize(11).text("Clinical Note");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(9).text(prescription.clinicalNote, { width: 500 });

    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").text("Prescriber Signature");
    doc.moveDown(0.75);
    doc.font("Helvetica").text("_______________________________");
    doc.text(providers.orderingPhysician);
    doc.text(`Date: ${prescription.prescribedDate}`);

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "This is a fictional prescription document for software demonstration only. Not valid for dispensing.",
        { width: 500 },
      );
  }).then((pageCount) => ({ filePath, pageCount }));
}

function validateBiomarkers(biomarkers: Biomarker[]): void {
  const keys = new Set(biomarkers.map((b) => b.biomarkerKey));

  if (keys.size < 35) {
    throw new Error(`Expected at least 35 unique biomarker keys, found ${keys.size}`);
  }

  for (const biomarker of biomarkers) {
    if (biomarker.baseline.value === undefined || biomarker.followUp.value === undefined) {
      throw new Error(`Missing baseline or follow-up value for ${biomarker.biomarkerKey}`);
    }
  }
}

async function main(): Promise<void> {
  const raw = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(raw) as DemoData;

  validateBiomarkers(data.biomarkers);

  console.log(`Loaded demo data: ${data.biomarkers.length} biomarkers (${new Set(data.biomarkers.map((b) => b.biomarkerKey)).size} unique keys)`);

  const baseline = await generateLabReport(data, "baseline", "baseline");
  console.log(`✓ ${path.basename(baseline.filePath)} — ${baseline.pageCount} pages`);

  const followUp = await generateLabReport(data, "followUp", "followUp");
  console.log(`✓ ${path.basename(followUp.filePath)} — ${followUp.pageCount} pages`);

  const rx = await generatePrescription(data);
  console.log(`✓ ${path.basename(rx.filePath)} — ${rx.pageCount} pages`);

  console.log("\nDemo fixtures generated in backend/testdata/");
}

main().catch((error) => {
  console.error("Failed to generate demo fixtures:", error);
  process.exit(1);
});
