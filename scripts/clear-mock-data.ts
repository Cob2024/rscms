import { PrismaClient, AccountType } from "@prisma/client";
import fs from "fs";
import path from "path";

// Load .env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env file directly:", e);
}

const prisma = new PrismaClient();

async function clearMockData() {
  console.log("\n==========================================");
  console.log("RSCMS: Clearing Mock/Seed Data from Database");
  console.log("==========================================");

  try {
    // Check active group
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });

    if (!group) {
      console.log("No active savings group found.");
    } else {
      console.log(`Active Group: ${group.name} (${group.id})`);
    }

    // 1. Delete Ledger Entries & Transactions
    console.log("\n1. Deleting mock ledger entries & transactions...");
    const deletedEntries = await prisma.ledgerEntry.deleteMany({});
    const deletedTx = await prisma.ledgerTransaction.deleteMany({});
    console.log(`✓ Deleted ${deletedEntries.count} ledger entries, ${deletedTx.count} ledger transactions.`);

    // 2. Delete Cycle Resolutions
    console.log("\n2. Deleting cycle resolutions...");
    const deletedResolutions = await prisma.cycleResolution.deleteMany({});
    console.log(`✓ Deleted ${deletedResolutions.count} cycle resolutions.`);

    // 3. Delete Payments & Allocations
    console.log("\n3. Deleting payments & allocations...");
    const deletedAllocations = await prisma.paymentAllocation.deleteMany({});
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✓ Deleted ${deletedAllocations.count} payment allocations, ${deletedPayments.count} payments.`);

    // 4. Delete Payouts & Payout Schedules
    console.log("\n4. Deleting payouts & payout schedules...");
    const deletedPayouts = await prisma.payout.deleteMany({});
    const deletedSchedules = await prisma.payoutSchedule.deleteMany({});
    console.log(`✓ Deleted ${deletedPayouts.count} payouts, ${deletedSchedules.count} payout schedules.`);

    // 5. Delete Contribution Obligations & Periods
    console.log("\n5. Deleting contribution obligations & periods...");
    const deletedObligations = await prisma.contributionObligation.deleteMany({});
    const deletedPeriods = await prisma.contributionPeriod.deleteMany({});
    console.log(`✓ Deleted ${deletedObligations.count} obligations, ${deletedPeriods.count} periods.`);

    // 6. Delete Savings Cycles
    console.log("\n6. Deleting savings cycles...");
    const deletedCycles = await prisma.savingsCycle.deleteMany({});
    console.log(`✓ Deleted ${deletedCycles.count} savings cycles.`);

    // 7. Delete Members
    console.log("\n7. Deleting mock members (Member A, B, C, D)...");
    const deletedMembers = await prisma.member.deleteMany({});
    console.log(`✓ Deleted ${deletedMembers.count} members.`);

    // 8. Delete Member Notifications
    console.log("\n8. Cleaning notifications...");
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✓ Deleted ${deletedNotifications.count} notifications.`);

    // 9. Ensure 6 Standard Ledger Accounts exist for the group
    if (group) {
      console.log("\n9. Verifying standard Chart of Accounts for the group...");
      const standardAccounts = [
        { code: "1010", name: "Cash & Clearing Account", type: AccountType.ASSET, description: "Group bank, cash, and mobile money clearing account" },
        { code: "1020", name: "Member Contribution Receivables", type: AccountType.ASSET, description: "Expected unpaid contributions from group members" },
        { code: "2010", name: "Member Payout Obligations", type: AccountType.LIABILITY, description: "Scheduled rotation payout amounts owed to members" },
        { code: "3010", name: "Group Savings Capital", type: AccountType.EQUITY, description: "Retained group savings reserve capital" },
        { code: "4010", name: "Contribution Revenue", type: AccountType.REVENUE, description: "Recognized contribution collections from active members" },
        { code: "5010", name: "Payout Disbursements", type: AccountType.EXPENSE, description: "Disbursed rotation payouts to scheduled recipients" },
      ];

      for (const acc of standardAccounts) {
        await prisma.ledgerAccount.upsert({
          where: {
            groupId_code: {
              groupId: group.id,
              code: acc.code,
            },
          },
          update: { name: acc.name, type: acc.type, description: acc.description, isActive: true },
          create: { groupId: group.id, code: acc.code, name: acc.name, type: acc.type, description: acc.description, isActive: true },
        });
      }
      console.log("✓ All 6 standard Chart of Accounts are verified and ready.");
    }

    // 10. Audit log
    const admin = await prisma.adminUser.findFirst();
    if (admin) {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "MOCK_DATA_CLEARED",
          entityType: "SavingsGroup",
          entityId: group?.id || admin.id,
          newValues: { message: "Mock members and sample cycles cleared for real data onboarding." },
        },
      });
    }

    console.log("\n==========================================");
    console.log("Database reset complete!");
    console.log("Admin account preserved.");
    console.log("You can now add your 4 real members and launch your real savings cycle.");
    console.log("==========================================\n");
  } catch (error: any) {
    console.error("Error clearing mock data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearMockData();
