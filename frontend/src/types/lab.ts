import type { BiomarkerStatus } from "@/lib/tokens";

export type LabTrendDirection = "rising" | "falling" | "stable";

export type RecentReadingPoint = {
  value: number;
  readingDate: string;
};

export type TrackedBiomarker = {
  biomarkerKey: string;
  biomarkerName: string;
  displayName: string;
  latestValue: number;
  unit: string;
  latestDate: string;
  status: BiomarkerStatus | null;
  category: string;
  trendDirection: LabTrendDirection;
  deltaPct: number | null;
  readingCount: number;
  recentReadings: RecentReadingPoint[];
};

export type LabBiomarkerCategory = {
  category: string;
  biomarkers: TrackedBiomarker[];
};

export type LabBiomarkersResponse = {
  totalTracked: number;
  concerningCount: number;
  borderlineCount: number;
  categories: LabBiomarkerCategory[];
};

export type LabTrendSummary = {
  latestValue: number;
  latestDate: string;
  previousValue: number | null;
  status: BiomarkerStatus | null;
  trend: {
    direction: LabTrendDirection;
    slope: number;
    deltaPct: number | null;
    readingCount: number;
  };
};

export type LabReading = {
  id: string;
  biomarkerKey: string;
  biomarkerName: string;
  value: number;
  unit: string;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  status: BiomarkerStatus | null;
  readingDate: string;
  source: "lab_report" | "manual";
  notes: string | null;
  createdAt: string;
};

export type BiomarkerDetail = {
  biomarkerKey: string;
  displayName: string;
  category: string;
  unit: string;
  referenceRange: { low: number | null; high: number | null } | null;
  summary: LabTrendSummary | null;
  readings: LabReading[];
};

export type BiomarkerInsight = {
  biomarkerKey: string;
  insight: string;
  cached: boolean;
  generatedAt: string;
};

export type BiomarkerAlertType = "status_change" | "large_delta" | "consecutive_high";

export type BiomarkerAlert = {
  id: string;
  biomarkerKey: string;
  alertType: BiomarkerAlertType;
  previousValue: number | null;
  newValue: number | null;
  previousStatus: BiomarkerStatus | null;
  newStatus: BiomarkerStatus | null;
  isRead: boolean;
  createdAt: string;
};

export type CreateManualReadingInput = {
  biomarkerKey: string;
  biomarkerName: string;
  value: number;
  unit: string;
  readingDate: string;
  notes?: string | null;
};

export type ChartTimeRange = "3M" | "6M" | "1Y" | "ALL";
