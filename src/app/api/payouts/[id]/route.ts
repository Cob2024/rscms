import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PayoutService, PayoutServiceError } from "@/services/payout.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await PayoutService.getPayoutById(params.id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof PayoutServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/payouts/[id] error:", error);
    return NextResponse.json(
      { error: "Could not retrieve payout details." },
      { status: 500 }
    );
  }
}

