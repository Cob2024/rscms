import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

function cell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const group = await prisma.savingsGroup.findFirst({ where: { isActive: true }, select: { id: true, name: true } });
    if (!group) return NextResponse.json({ error: "Configure a savings group before generating reports." }, { status: 409 });
    const reportType = request.nextUrl.searchParams.get("type") ?? "monthly";
    let rows: (string | number)[][];
    if (reportType === "payouts") {
      const payouts = await prisma.payout.findMany({ where: { schedule: { cycle: { groupId: group.id } } }, orderBy: { createdAt: "asc" }, include: { member: { select: { fullName: true } }, schedule: { include: { cycle: { select: { cycleNumber: true } }, period: { select: { periodNumber: true } } } } } });
      rows = [["Cycle", "Period", "Recipient", "Expected pesewas", "Authorized pesewas", "Disbursed pesewas", "Outstanding pesewas", "Status", "Reference", "Disbursed at", "Acknowledged at"], ...payouts.map((payout) => [payout.schedule.cycle.cycleNumber, payout.schedule.period.periodNumber, payout.member.fullName, payout.expectedAmount, payout.authorizedAmount, payout.actualAmount, payout.outstandingAmount, payout.status, payout.reference ?? "", payout.disbursedAt?.toISOString() ?? "", payout.acknowledgedAt?.toISOString() ?? ""])];
    } else {
      const obligations = await prisma.contributionObligation.findMany({ where: { period: { cycle: { groupId: group.id } } }, orderBy: [{ period: { cycle: { cycleNumber: "asc" } } }, { period: { periodNumber: "asc" } }, { member: { rotationPosition: "asc" } }], include: { member: { select: { fullName: true, rotationPosition: true } }, period: { select: { periodNumber: true, dueDate: true, cycle: { select: { cycleNumber: true } } } }, allocations: { where: { payment: { status: "VERIFIED" } }, select: { amount: true } } } });
      const filtered = reportType === "outstanding" ? obligations.filter((obligation) => obligation.allocations.reduce((sum, allocation) => sum + allocation.amount, 0) < obligation.amount) : obligations;
      rows = [["Cycle", "Period", "Member", "Rotation", "Deadline", "Expected pesewas", "Verified pesewas", "Outstanding pesewas", "Status"], ...filtered.map((obligation) => { const paid = obligation.allocations.reduce((sum, allocation) => sum + allocation.amount, 0); return [obligation.period.cycle.cycleNumber, obligation.period.periodNumber, obligation.member.fullName, obligation.member.rotationPosition, obligation.period.dueDate.toISOString().slice(0, 10), obligation.amount, paid, Math.max(0, obligation.amount - paid), paid >= obligation.amount ? "PAID" : paid ? "PARTIAL" : new Date() > obligation.period.dueDate ? "OVERDUE" : "PENDING"]; })];
    }
    const csv = `Group,${cell(group.name)}\nGenerated,${cell(new Date().toISOString())}\n\n${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
    const filename = `${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${reportType}.csv`;
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not generate this report." }, { status: 500 });
  }
}
