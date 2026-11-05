import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PayoutService, PayoutServiceError } from "@/services/payout.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await PayoutService.getOverview();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof PayoutServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/payouts error:", error);
    return NextResponse.json(
      { error: "Could not load payout schedules." },
      { status: 500 }
    );
  }
}
