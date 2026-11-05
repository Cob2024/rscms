import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

const input = z.object({ dueDate: z.string().datetime() });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid contribution deadline." }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      const period = await tx.contributionPeriod.findUnique({ where: { id: params.id } });
      if (!period) throw new Error("PERIOD_NOT_FOUND");
      if (period.dueDate <= new Date()) throw new Error("PERIOD_CLOSED");
      const dueDate = new Date(parsed.data.dueDate);
      if (dueDate < period.startDate) throw new Error("INVALID_DEADLINE");
      const previous = { dueDate: period.dueDate.toISOString(), deadlineConfiguredBy: period.deadlineConfiguredBy };
      const result = await tx.contributionPeriod.update({ where: { id: period.id }, data: { dueDate, closeDate: dueDate, deadlineConfiguredBy: admin.id } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "CONTRIBUTION_DEADLINE_CHANGED", entityType: "ContributionPeriod", entityId: period.id, oldValues: previous, newValues: { dueDate: dueDate.toISOString(), deadlineConfiguredBy: admin.id } } });
      return result;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ period: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known: Record<string, [number, string]> = { PERIOD_NOT_FOUND: [404, "Contribution period not found."], PERIOD_CLOSED: [409, "A deadline can only be changed while the original deadline is still in the future."], INVALID_DEADLINE: [400, "Deadline must be on or after the period start date."] };
    if (known[message]) return NextResponse.json({ error: known[message][1] }, { status: known[message][0] });
    return NextResponse.json({ error: "Could not update contribution deadline." }, { status: 500 });
  }
}
