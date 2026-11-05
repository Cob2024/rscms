import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { LedgerService } from "@/services/ledger.service";
import { transactionFilterSchema } from "@/lib/validation/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterInput = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
      type: (searchParams.get("type") as any) || undefined,
      accountId: searchParams.get("accountId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const parsedFilter = transactionFilterSchema.safeParse(filterInput);
    if (!parsedFilter.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsedFilter.error.flatten() },
        { status: 400 }
      );
    }

    const result = await LedgerService.getTransactions(parsedFilter.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: error?.message || "Could not load transactions." },
      { status: 500 }
    );
  }
}

