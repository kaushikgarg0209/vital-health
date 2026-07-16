export type BiomarkerStatus = "normal" | "borderline" | "concerning" | "critical";

export type BiomarkerReading = {
  id: string;
  biomarkerKey: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
  recordedAt: string;
};
