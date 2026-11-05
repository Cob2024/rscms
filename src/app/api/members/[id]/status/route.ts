import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateMemberStatusSchema } from "@/lib/validation/member";
import { MemberService, MemberServiceError } from "@/services/member.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateMemberStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid status." },
        { status: 400 }
      );
    }

    const member = await MemberService.updateMemberStatus(
      admin.id,
      params.id,
      parsed.data.status,
      parsed.data.reason
    );

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`PATCH /api/members/${params.id}/status error:`, error);
    return NextResponse.json({ error: "Failed to update member status." }, { status: 500 });
  }
}

