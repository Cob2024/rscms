import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { LedgerService } from "@/services/ledger.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cashReconciliation = await LedgerService.getCashReconciliation();
    return NextResponse.json(cashReconciliation);
  } catch (error: any) {
    console.error("GET /api/ledger/cash-reconciliation error:", error);
    return NextResponse.json(
      { error: error?.message || "Could not load cash reconciliation." },
      { status: 500 }
    );
  }
}

