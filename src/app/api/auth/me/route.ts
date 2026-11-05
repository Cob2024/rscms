import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired session." }, { status: 401 });
    }

    return NextResponse.json({
      id: admin.id,
      supabaseId: admin.supabaseId,
      email: admin.email,
      fullName: admin.fullName,
      role: "admin",
    });
  } catch (error) {
    console.error("Error in GET /api/auth/me:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
