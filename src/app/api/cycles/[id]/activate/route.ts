import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CycleService, CycleServiceError } from "@/services/cycle.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cycle = await CycleService.activateCycle(admin.id, id);
    return NextResponse.json({ ok: true, cycle });
  } catch (error) {
    if (error instanceof CycleServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`POST /api/cycles/${id}/activate error:`, error);
    return NextResponse.json({ error: "Failed to activate cycle." }, { status: 500 });
  }
}

