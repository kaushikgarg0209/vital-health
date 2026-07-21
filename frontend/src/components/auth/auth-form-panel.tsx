import { cn } from "@/lib/utils";

type AuthFormPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthFormPanel({
  title,
  description,
  children,
  className,
}: AuthFormPanelProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8 space-y-2.5">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-800 sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
