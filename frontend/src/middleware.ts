import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/records",
  "/lab",
  "/advocate",
  "/family",
  "/settings",
];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function fetchSession(request: NextRequest) {
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
      data?: { user?: { id: string; email: string } };
    };

    return payload.data?.user ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthRoute(pathname) && !isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const user = await fetchSession(request);

  if (isProtectedRoute(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
  ],
};
