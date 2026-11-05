import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const search = request.nextUrl.searchParams.get("q")?.trim();
    const uuidSearch = search && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(search);
    const logs = await prisma.auditLog.findMany({ where: search ? { OR: [{ action: { contains: search, mode: "insensitive" } }, { entityType: { contains: search, mode: "insensitive" } }, ...(uuidSearch ? [{ entityId: search }] : [])] } : undefined, orderBy: { createdAt: "desc" }, take: 250 });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Could not load audit history." }, { status: 500 });
  }
}
