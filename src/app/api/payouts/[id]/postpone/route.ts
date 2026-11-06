import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PayoutService, PayoutServiceError } from "@/services/payout.service";
import { postponePayoutSchema } from "@/lib/validation/payout";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = postponePayoutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid postponement reason" },
        { status: 400 }
      );
    }

    const schedule = await PayoutService.postponePayout(
      admin.id,
      id,
      parseResult.data
    );

    return NextResponse.json({ ok: true, schedule });
  } catch (error) {
    if (error instanceof PayoutServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST /api/payouts/[id]/postpone error:", error);
    return NextResponse.json(
      { error: "Could not record payout postponement." },
      { status: 500 }
    );
  }
}
