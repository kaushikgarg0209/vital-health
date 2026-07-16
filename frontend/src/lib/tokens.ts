// Central design token registry for Vital.
// Use this for any dynamic color or style decision in React/JS.
// For static Tailwind class names, use globals.css @theme tokens instead.

export type BiomarkerStatus = "normal" | "borderline" | "concerning" | "critical";

export const biomarkerStatus = {
  normal: {
    label: "Normal",
    color: "#10B981",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-300",
    dotClass: "bg-emerald-500",
    chartColor: "#10B981",
    pulse: false,
  },
  borderline: {
    label: "Borderline",
    color: "#F59E0B",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
    borderClass: "border-amber-300",
    dotClass: "bg-amber-500",
    chartColor: "#F59E0B",
    pulse: false,
  },
  concerning: {
    label: "Concerning",
    color: "#EF4444",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-300",
    dotClass: "bg-red-500",
    chartColor: "#EF4444",
    pulse: true,
  },
  critical: {
    label: "Critical",
    color: "#E11D48",
    bgClass: "bg-rose-100",
    textClass: "text-rose-900",
    borderClass: "border-rose-400",
    dotClass: "bg-rose-600",
    chartColor: "#E11D48",
    pulse: true,
  },
} satisfies Record<
  BiomarkerStatus,
  {
    label: string;
    color: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
    chartColor: string;
    pulse: boolean;
  }
>;

export type TrendDirection = "improving" | "stable" | "worsening";

export const trendTokens = {
  improving: {
    label: "Improving",
    color: "#10B981",
    iconName: "TrendingDown",
    textClass: "text-emerald-600",
  },
  stable: {
    label: "Stable",
    color: "#94A3B8",
    iconName: "Minus",
    textClass: "text-neutral-400",
  },
  worsening: {
    label: "Worsening",
    color: "#EF4444",
    iconName: "TrendingUp",
    textClass: "text-red-500",
  },
} satisfies Record<
  TrendDirection,
  { label: string; color: string; iconName: string; textClass: string }
>;

export type DocumentType =
  | "lab_report"
  | "prescription"
  | "discharge_summary"
  | "imaging_report"
  | "medical_bill"
  | "insurance_eob"
  | "insurance_policy"
  | "vaccination_record"
  | "other";

export const documentTypeTokens = {
  lab_report: {
    label: "Lab Report",
    iconName: "FlaskConical",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  prescription: {
    label: "Prescription",
    iconName: "Pill",
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
  },
  discharge_summary: {
    label: "Discharge Summary",
    iconName: "FileHeart",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  imaging_report: {
    label: "Imaging Report",
    iconName: "Scan",
    colorClass: "text-cyan-600",
    bgClass: "bg-cyan-50",
  },
  medical_bill: {
    label: "Medical Bill",
    iconName: "Receipt",
    colorClass: "text-orange-600",
    bgClass: "bg-orange-50",
  },
  insurance_eob: {
    label: "Explanation of Benefits",
    iconName: "ShieldCheck",
    colorClass: "text-teal-600",
    bgClass: "bg-teal-50",
  },
  insurance_policy: {
    label: "Insurance Policy",
    iconName: "Shield",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
  },
  vaccination_record: {
    label: "Vaccination Record",
    iconName: "Syringe",
    colorClass: "text-lime-600",
    bgClass: "bg-lime-50",
  },
  other: {
    label: "Other",
    iconName: "File",
    colorClass: "text-neutral-500",
    bgClass: "bg-neutral-100",
  },
} satisfies Record<
  DocumentType,
  { label: string; iconName: string; colorClass: string; bgClass: string }
>;

export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export const processingStatusTokens = {
  pending: {
    label: "Waiting",
    iconName: "Clock",
    colorClass: "text-neutral-400",
    spin: false,
  },
  processing: {
    label: "Processing",
    iconName: "Loader2",
    colorClass: "text-blue-500",
    spin: true,
  },
  completed: {
    label: "Ready",
    iconName: "CheckCircle2",
    colorClass: "text-emerald-600",
    spin: false,
  },
  failed: {
    label: "Failed",
    iconName: "XCircle",
    colorClass: "text-red-500",
    spin: false,
  },
} satisfies Record<
  ProcessingStatus,
  { label: string; iconName: string; colorClass: string; spin: boolean }
>;

export interface LevelDefinition {
  level: number;
  title: string;
  minPoints: number;
  textClass: string;
  bgClass: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    title: "Health Starter",
    minPoints: 0,
    textClass: "text-neutral-500",
    bgClass: "bg-neutral-100",
  },
  {
    level: 2,
    title: "Health Aware",
    minPoints: 500,
    textClass: "text-sky-700",
    bgClass: "bg-sky-100",
  },
  {
    level: 3,
    title: "Health Active",
    minPoints: 1500,
    textClass: "text-blue-700",
    bgClass: "bg-blue-100",
  },
  {
    level: 4,
    title: "Health Champion",
    minPoints: 4000,
    textClass: "text-violet-700",
    bgClass: "bg-violet-100",
  },
  {
    level: 5,
    title: "Health Advocate",
    minPoints: 10000,
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-100",
  },
  {
    level: 6,
    title: "Vital Master",
    minPoints: 25000,
    textClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
];

export function getLevelForPoints(points: number): LevelDefinition {
  return [...LEVELS].reverse().find((l) => points >= l.minPoints) ?? LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  return LEVELS.find((l) => l.level === currentLevel + 1) ?? null;
}

export type PermissionLevel = "full" | "monitor" | "emergency";

export const permissionLevelTokens = {
  full: {
    label: "Full Access",
    textClass: "text-blue-700",
    bgClass: "bg-blue-100",
    description: "Can see all records, trends, bills, and insurance",
  },
  monitor: {
    label: "Health Monitor",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-100",
    description: "Can see lab trends, medications, and appointments only",
  },
  emergency: {
    label: "Emergency Only",
    textClass: "text-orange-700",
    bgClass: "bg-orange-100",
    description: "Can only access the emergency health brief",
  },
} satisfies Record<
  PermissionLevel,
  { label: string; textClass: string; bgClass: string; description: string }
>;

export const chartColors = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
  "#84CC16",
  "#F97316",
] as const;

export const chartReferenceRangeColor = "rgba(16, 185, 129, 0.07)";

export type NotificationType =
  | "biomarker_alert"
  | "family_alert"
  | "document_processed"
  | "document_failed"
  | "challenge_reminder"
  | "badge_earned"
  | "level_up"
  | "family_invitation"
  | "plan_updated";

export const notificationTypeTokens = {
  biomarker_alert: { iconName: "Activity", colorClass: "text-red-500" },
  family_alert: { iconName: "Users", colorClass: "text-amber-500" },
  document_processed: { iconName: "CheckCircle2", colorClass: "text-emerald-500" },
  document_failed: { iconName: "XCircle", colorClass: "text-red-500" },
  challenge_reminder: { iconName: "Target", colorClass: "text-blue-500" },
  badge_earned: { iconName: "Award", colorClass: "text-amber-500" },
  level_up: { iconName: "TrendingUp", colorClass: "text-violet-500" },
  family_invitation: { iconName: "UserPlus", colorClass: "text-blue-500" },
  plan_updated: { iconName: "RefreshCw", colorClass: "text-emerald-500" },
} satisfies Record<NotificationType, { iconName: string; colorClass: string }>;

export const layout = {
  sidebarWidth: 256,
  contentMaxWidth: 1024,
  headerHeight: 56,
  mobileBreakpoint: 768,
} as const;

export const duration = {
  fast: 100,
  normal: 200,
  slow: 300,
  slowest: 500,
} as const;
