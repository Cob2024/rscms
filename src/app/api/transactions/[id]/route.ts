import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { LedgerService } from "@/services/ledger.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const transaction = await LedgerService.getTransactionById(id);
    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Transaction not found." },
      { status: 404 }
    );
  }
}

