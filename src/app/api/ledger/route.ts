import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const group = await prisma.savingsGroup.findFirst({ where: { isActive: true }, select: { id: true, name: true } });
    if (!group) return NextResponse.json({ groupName: null, transactions: [] });
    const transactions = await prisma.ledgerTransaction.findMany({ where: { groupId: group.id }, orderBy: { createdAt: "desc" }, take: 250, include: { entries: { include: { account: { select: { code: true, name: true, type: true } } } } } });
    return NextResponse.json({ groupName: group.name, transactions: transactions.map((transaction) => ({ ...transaction, debits: transaction.entries.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + entry.amount, 0), credits: transaction.entries.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + entry.amount, 0) })) });
  } catch {
    return NextResponse.json({ error: "Could not load ledger records." }, { status: 500 });
  }
}
