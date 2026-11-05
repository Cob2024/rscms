import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createMemberSchema } from "@/lib/validation/member";
import { MemberService, MemberServiceError } from "@/services/member.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await MemberService.listMembers();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/members error:", error);
    return NextResponse.json({ error: "Failed to load members." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid member data." },
        { status: 400 }
      );
    }

    const member = await MemberService.createMember(admin.id, parsed.data);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST /api/members error:", error);
    return NextResponse.json({ error: "Failed to register member." }, { status: 500 });
  }
}
