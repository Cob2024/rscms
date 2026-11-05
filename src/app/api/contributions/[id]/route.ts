import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ContributionService, ContributionServiceError } from "@/services/contribution.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await ContributionService.getObligationById(params.id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ContributionServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`GET /api/contributions/${params.id} error:`, error);
    return NextResponse.json({ error: "Failed to load obligation details." }, { status: 500 });
  }
}

