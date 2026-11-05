import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createCycleSchema } from "@/lib/validation/cycle";
import { CycleService, CycleServiceError } from "@/services/cycle.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cycles = await CycleService.listCycles();
    return NextResponse.json({ cycles });
  } catch (error) {
    if (error instanceof CycleServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/cycles error:", error);
    return NextResponse.json({ error: "Failed to load savings cycles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createCycleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid cycle configuration." },
        { status: 400 }
      );
    }

    const cycle = await CycleService.createCycle(admin.id, parsed.data);
    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    if (error instanceof CycleServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "A unique constraint conflict occurred. Cycle or schedule already exists." },
        { status: 409 }
      );
    }
    console.error("POST /api/cycles error:", error);
    return NextResponse.json({ error: "Failed to create savings cycle." }, { status: 500 });
  }
}
