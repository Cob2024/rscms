import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CycleService, CycleServiceError } from "@/services/cycle.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await CycleService.getCycleById(id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof CycleServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`GET /api/cycles/${id} error:`, error);
    return NextResponse.json({ error: "Failed to retrieve cycle details." }, { status: 500 });
  }
}

