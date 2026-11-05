import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PaymentService, PaymentServiceError } from "@/services/payment.service";
import { recordManualPaymentSchema, paymentFilterSchema } from "@/lib/validation/payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterInput = {
      memberId: searchParams.get("memberId") || undefined,
      channel: (searchParams.get("channel") as any) || undefined,
      status: (searchParams.get("status") as any) || undefined,
      periodId: searchParams.get("periodId") || undefined,
      q: searchParams.get("q") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    };

    const parsedFilter = paymentFilterSchema.safeParse(filterInput);
    const filter = parsedFilter.success ? parsedFilter.data : undefined;

    const [paymentsData, formData] = await Promise.all([
      PaymentService.listPayments(filter),
      PaymentService.getFormData(),
    ]);

    return NextResponse.json({
      payments: paymentsData.payments,
      stats: paymentsData.stats,
      members: formData.members,
      obligations: formData.obligations,
      group: formData.group,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: "Could not load payment records." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = recordManualPaymentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.error.issues[0]?.message || "Invalid payment input",
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const payment = await PaymentService.recordManualPayment(
      admin.id,
      parseResult.data
    );

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { error: "Could not record payment." },
      { status: 500 }
    );
  }
}
