import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PayoutService, PayoutServiceError } from "@/services/payout.service";
import { authorizePayoutSchema } from "@/lib/validation/payout";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = authorizePayoutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid authorization input" },
        { status: 400 }
      );
    }

    const payout = await PayoutService.authorizePayout(
      admin.id,
      params.id,
      parseResult.data
    );

    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    if (error instanceof PayoutServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST /api/payouts/[id]/authorize error:", error);
    return NextResponse.json(
      { error: "Could not authorize payout." },
      { status: 500 }
    );
  }
}
