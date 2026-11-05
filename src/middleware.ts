import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicWebRoutes = ["/login", "/forgot-password", "/reset-password"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/logout", "/api/auth/session", "/api/webhooks"];

const SESSION_COOKIE = "rscms_access_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  let bearerToken: string | null = null;
  if (authHeader) {
    const trimmed = authHeader.replace(/^Bearer\s*/i, "").trim();
    if (trimmed && trimmed !== "undefined" && trimmed !== "null") {
      bearerToken = trimmed;
    }
  }

  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    bearerToken ||
    null;

  // Root redirect
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user has token and tries to visit login/auth pages, redirect to dashboard
  if (token && publicWebRoutes.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public web routes
  if (publicWebRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protect all other API routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication credentials." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect all dashboard and management web routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
