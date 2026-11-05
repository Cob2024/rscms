import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

const groupInput = z.object({ name: z.string().trim().min(2).max(120), contributionAmount: z.number().int().positive().max(100_000_000) });

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const group = await prisma.savingsGroup.findFirst({
    where: { isActive: true },
    include: {
      members: {
        where: { status: "ACTIVE" },
        select: { id: true, fullName: true, rotationPosition: true },
        orderBy: { rotationPosition: "asc" },
      },
      cycles: {
        orderBy: { cycleNumber: "desc" },
        take: 5,
        include: {
          periods: {
            orderBy: { periodNumber: "asc" },
            select: { id: true, periodNumber: true, startDate: true, dueDate: true },
          },
        },
      },
    },
  });
  return NextResponse.json({ group });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = groupInput.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid group settings." }, { status: 400 });
    const group = await prisma.$transaction(async (tx) => {
      if (await tx.savingsGroup.findFirst({ where: { isActive: true } })) throw new Error("GROUP_EXISTS");
      const created = await tx.savingsGroup.create({ data: { name: parsed.data.name, contributionAmount: parsed.data.contributionAmount, monthlyTarget: parsed.data.contributionAmount * 4, memberCount: 4 } });
      await tx.ledgerAccount.createMany({ data: [
        { groupId: created.id, code: "1000", name: "Group cash and bank", type: "ASSET", description: "Verified funds held by the group" },
        { groupId: created.id, code: "2100", name: "Member contributions", type: "LIABILITY", description: "Verified member contributions available for rotation payouts" },
      ] });
      await tx.auditLog.create({ data: { userId: admin.id, action: "GROUP_CREATED", entityType: "SavingsGroup", entityId: created.id, newValues: { name: created.name, contributionAmountPesewas: created.contributionAmount } } });
      return created;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "GROUP_EXISTS") return NextResponse.json({ error: "An active savings group already exists." }, { status: 409 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "An active savings group already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not save group settings." }, { status: 500 });
  }
}
