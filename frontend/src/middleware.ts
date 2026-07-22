import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/records",
  "/lab",
  "/advocate",
  "/family",
  "/settings",
  "/onboarding",
];

const ONBOARDING_ROUTE = "/onboarding";

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

type SessionPayload = {
  user?: { id: string; email: string };
  profile?: { hasCompletedSetup?: boolean } | null;
};

async function fetchSession(request: NextRequest): Promise<SessionPayload | null> {
  const sessionUrl = new URL("/api/v1/auth/session", request.url);

  try {
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: SessionPayload;
    };

    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthRoute(pathname) && !isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await fetchSession(request);
  const user = session?.user ?? null;
  const hasCompletedSetup = session?.profile?.hasCompletedSetup ?? false;

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === ONBOARDING_ROUTE && hasCompletedSetup) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    user &&
    isProtectedRoute(pathname) &&
    pathname !== ONBOARDING_ROUTE &&
    !hasCompletedSetup
  ) {
    return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
  }

  if (isAuthRoute(pathname) && user) {
    const destination = hasCompletedSetup ? "/dashboard" : ONBOARDING_ROUTE;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/records/:path*",
    "/lab/:path*",
    "/advocate/:path*",
    "/family/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
