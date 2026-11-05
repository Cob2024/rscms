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

    const trialBalance = await LedgerService.getTrialBalance();
    return NextResponse.json(trialBalance);
  } catch (error: any) {
    console.error("GET /api/ledger/trial-balance error:", error);
    return NextResponse.json(
      { error: error?.message || "Could not generate trial balance." },
      { status: 500 }
    );
  }
}

