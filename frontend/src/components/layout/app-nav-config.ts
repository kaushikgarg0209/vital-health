import type { LucideIcon } from "lucide-react";
import {
  Activity,
  FileText,
  FlaskConical,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/lab", label: "Lab Trends", icon: FlaskConical },
  { href: "/advocate", label: "AI Advocate", icon: MessageSquare },
  { href: "/family", label: "Family", icon: Users },
  { href: "/settings/profile", label: "Settings", icon: Settings },
];
