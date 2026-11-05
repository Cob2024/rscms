import { PrismaClient, MemberStatus, CycleStatus, AccountType, PayoutStatus, ContributionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for RSCMS...");

  // 1. Seed or find the default AdminUser
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@rscms.local" },
    update: {},
    create: {
      supabaseId: "00000000-0000-0000-0000-000000000001",
      email: "admin@rscms.local",
      fullName: "System Administrator",
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // 2. Seed or find the SavingsGroup
  const existingGroup = await prisma.savingsGroup.findFirst({
    where: { name: "RSCMS Savings Group" },
  });

  const group = existingGroup
    ? existingGroup
    : await prisma.savingsGroup.create({
        data: {
          name: "RSCMS Savings Group",
          description: "Rotating Savings and Contribution Management Group — 4 Members",
          contributionAmount: 25000, // GH₵250 in pesewas
          memberCount: 4,
          monthlyTarget: 100000, // GH₵1,000 in pesewas
          currency: "GHS",
          isActive: true,
        },
      });
  console.log(`✓ Savings group: ${group.name} (${group.id})`);

  // 3. Seed Chart of Accounts (Standard Ledger Accounts)
  const defaultAccounts = [
    {
      code: "1010",
      name: "Cash & Clearing Account",
      type: AccountType.ASSET,
      description: "Group bank, cash, and mobile money clearing account",
    },
    {
      code: "1020",
      name: "Member Contribution Receivables",
      type: AccountType.ASSET,
      description: "Track expected unpaid contribution obligations from members",
    },
    {
      code: "2010",
      name: "Member Payout Obligations",
      type: AccountType.LIABILITY,
      description: "Accrued payout amounts due for disbursement to rotation recipients",
    },
    {
      code: "3010",
      name: "Group Savings Capital",
      type: AccountType.EQUITY,
      description: "Group equity and reserve balance",
    },
    {
      code: "4010",
      name: "Contribution Revenue",
      type: AccountType.REVENUE,
      description: "Recognized verified monthly member contributions",
    },
    {
      code: "5010",
      name: "Payout Disbursements",
      type: AccountType.EXPENSE,
      description: "Completed payout distributions to rotation recipients",
    },
  ];

  for (const acc of defaultAccounts) {
    await prisma.ledgerAccount.upsert({
      where: {
        groupId_code: {
          groupId: group.id,
          code: acc.code,
        },
      },
      update: {
        name: acc.name,
        type: acc.type,
        description: acc.description,
      },
      create: {
        groupId: group.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
        isActive: true,
      },
    });
  }
  console.log(`✓ Seeded ${defaultAccounts.length} standard ledger accounts`);

  // 4. Seed the 4 Members (Rotation positions 1 through 4)
  const seedMembers = [
    {
      fullName: "Member A",
      phoneNumber: "+233240000001",
      email: "member.a@rscms.local",
      rotationPosition: 1,
    },
    {
      fullName: "Member B",
      phoneNumber: "+233240000002",
      email: "member.b@rscms.local",
      rotationPosition: 2,
    },
    {
      fullName: "Member C",
      phoneNumber: "+233240000003",
      email: "member.c@rscms.local",
      rotationPosition: 3,
    },
    {
      fullName: "Member D",
      phoneNumber: "+233240000004",
      email: "member.d@rscms.local",
      rotationPosition: 4,
    },
  ];

  const members = [];
  for (const m of seedMembers) {
    const member = await prisma.member.upsert({
      where: {
        groupId_rotationPosition: {
          groupId: group.id,
          rotationPosition: m.rotationPosition,
        },
      },
      update: {
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        email: m.email,
        status: MemberStatus.ACTIVE,
      },
      create: {
        groupId: group.id,
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        email: m.email,
        rotationPosition: m.rotationPosition,
        status: MemberStatus.ACTIVE,
      },
    });
    members.push(member);
    console.log(`✓ Member ${m.rotationPosition}: ${member.fullName}`);
  }

  // 5. Seed Cycle 1 (4 months) if not already existing
  const existingCycle = await prisma.savingsCycle.findUnique({
    where: {
      groupId_cycleNumber: {
        groupId: group.id,
        cycleNumber: 1,
      },
    },
  });

  if (!existingCycle) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endDate = new Date(Date.UTC(currentYear, currentMonth + 4, 0, 23, 59, 59));

    const cycle = await prisma.savingsCycle.create({
      data: {
        groupId: group.id,
        cycleNumber: 1,
        startDate,
        endDate,
        status: CycleStatus.ACTIVE,
        contributionAmount: 25000, // GH₵250 in pesewas
        monthlyTarget: 100000, // GH₵1,000 in pesewas
      },
    });
    console.log(`✓ Created Cycle 1 (ACTIVE)`);

    // Generate 4 monthly contribution periods
    for (let i = 1; i <= 4; i++) {
      const periodStart = new Date(Date.UTC(currentYear, currentMonth + (i - 1), 1));
      // Contribution deadline: 15th of each period month
      const dueDate = new Date(Date.UTC(currentYear, currentMonth + (i - 1), 15, 23, 59, 59));
      // Period closes at end of month
      const closeDate = new Date(Date.UTC(currentYear, currentMonth + i, 0, 23, 59, 59));

      const period = await prisma.contributionPeriod.create({
        data: {
          cycleId: cycle.id,
          periodNumber: i,
          startDate: periodStart,
          dueDate,
          closeDate,
          deadlineConfiguredBy: admin.id,
          amount: 25000, // GH₵250
        },
      });

      // Generate 1 obligation per member for this period
      for (const member of members) {
        await prisma.contributionObligation.create({
          data: {
            periodId: period.id,
            memberId: member.id,
            amount: 25000,
            paidAmount: 0,
            outstandingAmount: 25000,
            status: ContributionStatus.PENDING,
          },
        });
      }

      // Generate Payout Schedule for this period
      // Position 1 -> Member A (Period 1), Position 2 -> Member B (Period 2), etc.
      const recipientMember = members[i - 1];
      await prisma.payoutSchedule.create({
        data: {
          cycleId: cycle.id,
          periodId: period.id,
          memberId: recipientMember.id,
          rotationPosition: i,
          expectedAmount: 100000, // GH₵1,000 in pesewas
          scheduledDate: closeDate,
          status: PayoutStatus.SCHEDULED,
        },
      });

      console.log(`✓ Generated Period ${i}: Due ${dueDate.toISOString().split("T")[0]}, Recipient: ${recipientMember.fullName}`);
    }
  } else {
    console.log("✓ Cycle 1 already exists");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
