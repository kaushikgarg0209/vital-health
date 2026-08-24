import Link from "next/link";
import { Mail } from "lucide-react";
import { VitalLogo } from "./vital-logo";
import { SITE_CONFIG } from "@/lib/site-config";
import type { AuthUser } from "@/types/auth";

type FooterLink = {
  href: string;
  label: string;
};

function getProductLinks(user: AuthUser | null): FooterLink[] {
  if (user) {
    return [
      { href: "/#capabilities", label: "Capabilities" },
      { href: "/#platform", label: "Platform" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/records", label: "Records" },
      { href: "/lab", label: "Lab trends" },
      { href: "/fitness", label: "Fitness" },
    ];
  }

  return [
    { href: "/#capabilities", label: "Capabilities" },
    { href: "/#platform", label: "Platform" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#security", label: "Security" },
    { href: "/register", label: "Sign up" },
    { href: "/login", label: "Sign in" },
  ];
}

type SiteFooterProps = {
  user?: AuthUser | null;
};

export function SiteFooter({ user = null }: SiteFooterProps) {
  const productLinks = getProductLinks(user);

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <VitalLogo />
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              {SITE_CONFIG.tagline}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-800">Product</p>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 transition-colors hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-neutral-800">Contact</p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              Questions, feedback, or collaboration?
            </p>
            <a
              href={`mailto:${SITE_CONFIG.developerEmail}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              <Mail className="size-4" />
              Contact developer
            </a>
            <p className="mt-2 text-sm text-neutral-500">{SITE_CONFIG.developerEmail}</p>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-neutral-100 pt-6 text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</p>
          <p>
            Vital provides information from your health records and is not a substitute for
            professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
