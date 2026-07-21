import Link from "next/link";
import { VitalLogo } from "./vital-logo";
import type { AuthUser } from "@/types/auth";

function getFooterLinks(user: AuthUser | null) {
  if (user) {
    return {
      Product: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/#features", label: "Features" },
        { href: "/records", label: "Records" },
      ],
      Company: [
        { href: "/#how-it-works", label: "How it works" },
        { href: "/", label: "Home" },
      ],
      Legal: [
        { href: "#", label: "Privacy" },
        { href: "#", label: "Terms" },
      ],
    };
  }

  return {
    Product: [
      { href: "/#features", label: "Features" },
      { href: "/register", label: "Sign up" },
    ],
    Company: [
      { href: "/login", label: "Sign in" },
      { href: "/#how-it-works", label: "How it works" },
    ],
    Legal: [
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
    ],
  };
}

type SiteFooterProps = {
  user?: AuthUser | null;
};

export function SiteFooter({ user = null }: SiteFooterProps) {
  const footerLinks = getFooterLinks(user);

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-4">
            <VitalLogo />
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              Your personal health advocate. Organize records, track biomarkers,
              and get AI-powered guidance — all in one secure place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-sm font-semibold text-neutral-800">{title}</p>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
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
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-neutral-100 pt-6 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vital Health. All rights reserved.</p>
          <p>Built for people who take their health seriously.</p>
        </div>
      </div>
    </footer>
  );
}
