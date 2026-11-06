import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateMemberSchema } from "@/lib/validation/member";
import { MemberService, MemberServiceError } from "@/services/member.service";

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

    const data = await MemberService.getMemberById(id);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`GET /api/members/${id} error:`, error);
    return NextResponse.json({ error: "Failed to retrieve member details." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const member = await MemberService.updateMember(admin.id, id, parsed.data);
    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`PATCH /api/members/${id} error:`, error);
    return NextResponse.json({ error: "Failed to update member." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await MemberService.deleteMember(admin.id, id);
    return NextResponse.json({ ok: true, deletedMember: deleted });
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(`DELETE /api/members/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete member." }, { status: 500 });
  }
}

