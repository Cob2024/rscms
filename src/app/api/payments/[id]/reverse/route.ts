import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PaymentService, PaymentServiceError } from "@/services/payment.service";
import { reversePaymentSchema } from "@/lib/validation/payment";

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
    const parseResult = reversePaymentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid reversal reason" },
        { status: 400 }
      );
    }

    const payment = await PaymentService.reversePayment(
      admin.id,
      id,
      parseResult.data.reason
    );

    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST /api/payments/[id]/reverse error:", error);
    return NextResponse.json(
      { error: "Could not reverse payment." },
      { status: 500 }
    );
  }
}

