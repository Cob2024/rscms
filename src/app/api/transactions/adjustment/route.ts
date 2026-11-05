import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { LedgerService } from "@/services/ledger.service";
import { recordAdjustmentSchema } from "@/lib/validation/ledger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Missing JSON request body." },
        { status: 400 }
      );
    }

    const parseResult = recordAdjustmentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid adjustment entry data.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const transaction = await LedgerService.recordManualAdjustment(
      parseResult.data,
      admin.id
    );

    return NextResponse.json(
      {
        message: "Manual journal adjustment recorded successfully.",
        transaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/transactions/adjustment error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record journal adjustment." },
      { status: 400 }
    );
  }
}

