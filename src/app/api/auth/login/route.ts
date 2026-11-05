import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/database/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { SESSION_COOKIE } from "@/lib/auth/supabase-server";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // 1. Check rate limit
  const rateLimitStatus = checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please try again in ${rateLimitStatus.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        },
      }
    );
  }

  // 2. Validate request payload
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials format.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Authentication service not configured." },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Attempt sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      const failed = recordFailedAttempt(ip);
      const remainingMsg = failed.blocked
        ? "Account temporarily locked due to repeated failures."
        : `Invalid email or password. ${failed.remaining} attempts remaining.`;

      return NextResponse.json(
        { error: remainingMsg },
        { status: 401 }
      );
    }

    // 4. Verify user exists in admin_users database table
    const admin = await prisma.adminUser.findUnique({
      where: { supabaseId: authData.user.id },
      select: { id: true, email: true, fullName: true },
    });

    if (!admin) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Access denied: User is not authorized as an administrator." },
        { status: 403 }
      );
    }

    // 5. Successful login: reset rate limiter
    resetRateLimit(ip);

    // 6. Record in audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "ADMIN_LOGIN",
        entityType: "AdminUser",
        entityId: admin.id,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
        newValues: { email: admin.email, timestamp: new Date().toISOString() },
      },
    }).catch((e) => console.error("Audit log error on login:", e));

    // 7. Set secure HttpOnly session cookie
    const response = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: "admin",
      },
      expiresIn: authData.session.expires_in,
    });

    response.cookies.set(SESSION_COOKIE, authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authData.session.expires_in || 3600,
    });

    return response;
  } catch (error) {
    console.error("Login processing error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

