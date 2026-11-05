import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/database/prisma";
import { SESSION_COOKIE } from "@/lib/auth/supabase-server";
import { getClientIp } from "@/lib/auth/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (admin) {
      // Record logout audit log
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "ADMIN_LOGOUT",
          entityType: "AdminUser",
          entityId: admin.id,
          ipAddress: getClientIp(request.headers),
          userAgent: request.headers.get("user-agent"),
          newValues: { email: admin.email, timestamp: new Date().toISOString() },
        },
      }).catch((e) => console.error("Audit log error on logout:", e));
    }

    const response = NextResponse.json({ ok: true, message: "Logged out successfully." });

    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

