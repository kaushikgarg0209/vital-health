"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ProfileSection({
  title,
  description,
  children,
  className,
}: ProfileSectionProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-1 border-b border-neutral-100 pb-4">
        <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
        {description ? <p className="text-sm text-neutral-400">{description}</p> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
