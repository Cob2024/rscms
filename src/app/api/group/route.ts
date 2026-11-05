import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

const groupInput = z.object({ name: z.string().trim().min(2).max(120), contributionAmount: z.number().int().positive().max(100_000_000) });

const updateGroupInput = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters").max(120).optional(),
  memberCount: z
    .number()
    .int("Capacity must be an integer")
    .min(2, "Group capacity must be at least 2 members")
    .max(100, "Group capacity cannot exceed 100 members")
    .optional(),
  contributionAmount: z
    .number()
    .int("Contribution must be an integer in pesewas")
    .positive("Contribution must be positive")
    .max(100_000_000)
    .optional(),
});

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

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
      include: {
        members: { where: { status: "ACTIVE" } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Active savings group not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateGroupInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid group settings update." },
        { status: 400 }
      );
    }

    const { name, memberCount, contributionAmount } = parsed.data;

    // Check that new memberCount is not lower than currently registered active members
    if (memberCount !== undefined && memberCount < group.members.length) {
      return NextResponse.json(
        {
          error: `Cannot reduce group capacity to ${memberCount} because there are already ${group.members.length} active members registered.`,
        },
        { status: 409 }
      );
    }

    const newContributionAmount = contributionAmount ?? group.contributionAmount;
    const newMemberCount = memberCount ?? group.memberCount;
    const newMonthlyTarget = newContributionAmount * newMemberCount;

    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.savingsGroup.update({
        where: { id: group.id },
        data: {
          name: name ?? group.name,
          memberCount: newMemberCount,
          contributionAmount: newContributionAmount,
          monthlyTarget: newMonthlyTarget,
        },
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

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "GROUP_UPDATED",
          entityType: "SavingsGroup",
          entityId: group.id,
          oldValues: {
            name: group.name,
            memberCount: group.memberCount,
            contributionAmount: group.contributionAmount,
            monthlyTarget: group.monthlyTarget,
          },
          newValues: {
            name: g.name,
            memberCount: g.memberCount,
            contributionAmount: g.contributionAmount,
            monthlyTarget: g.monthlyTarget,
          },
        },
      });

      return g;
    });

    return NextResponse.json({ group: updated });
  } catch (error: any) {
    console.error("PATCH /api/group error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update group configuration." },
      { status: 500 }
    );
  }
}
