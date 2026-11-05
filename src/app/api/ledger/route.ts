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

    const [trialBalance, cashReconciliation, accountsSummary, recentTx] =
      await Promise.all([
        LedgerService.getTrialBalance(),
        LedgerService.getCashReconciliation(),
        LedgerService.getAccountBalances(),
        LedgerService.getTransactions({ limit: 25 }),
      ]);

    return NextResponse.json({
      groupName: trialBalance.group.name,
      trialBalance,
      cashReconciliation,
      accountsSummary,
      transactions: recentTx.transactions,
      pagination: recentTx.pagination,
    });
  } catch (error: any) {
    console.error("GET /api/ledger error:", error);
    return NextResponse.json(
      { error: error?.message || "Could not load ledger records." },
      { status: 500 }
    );
  }
}
