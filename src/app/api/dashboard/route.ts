import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deriveContributionStatus } from "@/lib/financial/contribution-status";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const group = await prisma.savingsGroup.findFirst({ where: { isActive: true }, include: { members: { where: { status: "ACTIVE" }, orderBy: { rotationPosition: "asc" } }, cycles: { where: { status: "ACTIVE" }, orderBy: { cycleNumber: "desc" }, take: 1, include: { periods: { where: { startDate: { lte: new Date() } }, orderBy: { periodNumber: "desc" }, take: 1, include: { obligations: { include: { member: true, allocations: { where: { payment: { status: "VERIFIED" } }, select: { amount: true } } } } } }, payoutSchedules: { orderBy: { rotationPosition: "asc" }, include: { member: true, payouts: { orderBy: { createdAt: "desc" }, take: 1 } } } } } } });
    if (!group) return NextResponse.json({ configured: false });
    const cycle = group.cycles[0];
    const period = cycle?.periods[0];
    const obligations = period?.obligations ?? [];
    const expected = obligations.reduce((total, obligation) => total + obligation.amount, 0);
    const verified = period ? await prisma.paymentAllocation.aggregate({ where: { obligation: { periodId: period.id }, payment: { status: "VERIFIED" } }, _sum: { amount: true } }) : { _sum: { amount: null } };
    const verifiedAmount = verified._sum.amount ?? 0;
    const [disbursed, assetEntries, recentTransactions] = await Promise.all([
      prisma.payout.aggregate({ where: { schedule: { cycleId: cycle?.id }, status: { in: ["DISBURSED", "ACKNOWLEDGED", "PARTIAL"] } }, _sum: { actualAmount: true } }),
      prisma.ledgerEntry.findMany({ where: { transaction: { groupId: group.id }, account: { type: "ASSET" } }, select: { amount: true, direction: true } }),
      prisma.ledgerTransaction.findMany({ where: { groupId: group.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
    const available = assetEntries.reduce((balance, entry) => balance + (entry.direction === "DEBIT" ? entry.amount : -entry.amount), 0);
    const nextSchedule = cycle?.payoutSchedules.find((schedule) => schedule.status !== "ACKNOWLEDGED");
    const now = new Date();
    const currentObligations = obligations.map((obligation) => {
      const paid = obligation.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      const status = deriveContributionStatus(obligation.amount, paid, period!.dueDate, now);
      return { id: obligation.id, name: obligation.member.fullName, position: obligation.member.rotationPosition, expected: obligation.amount, paid, status };
    });
    return NextResponse.json({
      configured: true,
      group: { name: group.name, activeMembers: group.members.length, cycleNumber: cycle?.cycleNumber ?? null },
      period: period ? { id: period.id, periodNumber: period.periodNumber, dueDate: period.dueDate, expected, verified: verifiedAmount, outstanding: Math.max(0, expected - verifiedAmount), obligations: currentObligations } : null,
      disbursed: disbursed._sum.actualAmount ?? 0,
      available,
      nextRecipient: nextSchedule ? { name: nextSchedule.member.fullName, position: nextSchedule.rotationPosition, scheduledDate: nextSchedule.scheduledDate, amount: nextSchedule.expectedAmount } : null,
      transactions: recentTransactions.map((transaction) => ({ id: transaction.id, reference: transaction.reference, type: transaction.transactionType, description: transaction.description, date: transaction.createdAt })),
    });
  } catch {
    return NextResponse.json({ error: "Could not load verified financial records." }, { status: 500 });
  }
}
