import { randomUUID } from "crypto";
import { prisma } from "@/lib/database/prisma";
import { CycleStatus, PayoutStatus, ContributionStatus } from "@prisma/client";
import { CreateCycleInput, UpdateDeadlineInput } from "@/lib/validation/cycle";
import { addMonths } from "date-fns";

export class CycleServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "CycleServiceError";
    this.statusCode = statusCode;
  }
}

export class CycleService {
  /**
   * Helper to resolve the active savings group.
   */
  private static async getActiveGroup() {
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });
    if (!group) {
      throw new CycleServiceError("Active savings group not configured.", 404);
    }
    return group;
  }

  /**
   * List all cycles with their periods and progress summary.
   */
  static async listCycles() {
    const group = await this.getActiveGroup();

    const cycles = await prisma.savingsCycle.findMany({
      where: { groupId: group.id },
      orderBy: { cycleNumber: "desc" },
      include: {
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            obligations: {
              select: {
                amount: true,
                paidAmount: true,
                status: true,
              },
            },
            payoutSchedules: {
              include: {
                member: {
                  select: { id: true, fullName: true, rotationPosition: true },
                },
              },
            },
          },
        },
      },
    });

    return cycles.map((c) => {
      const allObligations = c.periods.flatMap((p) => p.obligations);
      const totalExpectedPesewas = allObligations.reduce((sum, o) => sum + o.amount, 0);
      const totalVerifiedPaidPesewas = allObligations.reduce((sum, o) => sum + o.paidAmount, 0);
      const outstandingPesewas = Math.max(0, totalExpectedPesewas - totalVerifiedPaidPesewas);

      return {
        id: c.id,
        cycleNumber: c.cycleNumber,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        contributionAmount: c.contributionAmount,
        monthlyTarget: c.monthlyTarget,
        totalExpectedPesewas,
        totalVerifiedPaidPesewas,
        outstandingPesewas,
        periods: c.periods.map((p) => {
          const expected = p.obligations.reduce((sum, o) => sum + o.amount, 0);
          const collected = p.obligations.reduce((sum, o) => sum + o.paidAmount, 0);
          const schedule = p.payoutSchedules[0] || null;

          return {
            id: p.id,
            periodNumber: p.periodNumber,
            startDate: p.startDate,
            dueDate: p.dueDate,
            closeDate: p.closeDate,
            amount: p.amount,
            expectedPesewas: expected,
            collectedPesewas: collected,
            recipient: schedule ? schedule.member : null,
            scheduleStatus: schedule ? schedule.status : null,
          };
        }),
      };
    });
  }

  /**
   * Get complete details of a specific savings cycle.
   */
  static async getCycleById(id: string) {
    const cycle = await prisma.savingsCycle.findUnique({
      where: { id },
      include: {
        group: {
          select: { id: true, name: true, currency: true, memberCount: true },
        },
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            obligations: {
              include: {
                member: {
                  select: { id: true, fullName: true, rotationPosition: true, phoneNumber: true },
                },
              },
              orderBy: { member: { rotationPosition: "asc" } },
            },
            payoutSchedules: {
              include: {
                member: {
                  select: { id: true, fullName: true, rotationPosition: true, phoneNumber: true },
                },
                payouts: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new CycleServiceError("Savings cycle not found.", 404);
    }

    const allObligations = cycle.periods.flatMap((p) => p.obligations);
    const totalExpectedPesewas = allObligations.reduce((sum, o) => sum + o.amount, 0);
    const totalVerifiedPaidPesewas = allObligations.reduce((sum, o) => sum + o.paidAmount, 0);
    const outstandingPesewas = Math.max(0, totalExpectedPesewas - totalVerifiedPaidPesewas);

    return {
      cycle: {
        id: cycle.id,
        cycleNumber: cycle.cycleNumber,
        status: cycle.status,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        contributionAmount: cycle.contributionAmount,
        monthlyTarget: cycle.monthlyTarget,
        group: cycle.group,
      },
      financialSummary: {
        totalExpectedPesewas,
        totalVerifiedPaidPesewas,
        outstandingPesewas,
      },
      periods: cycle.periods,
    };
  }

  /**
   * Helper to retrieve the current active cycle.
   */
  static async getActiveCycle() {
    const group = await this.getActiveGroup();
    return await prisma.savingsCycle.findFirst({
      where: { groupId: group.id, status: CycleStatus.ACTIVE },
      include: {
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            obligations: true,
            payoutSchedules: {
              include: {
                member: true,
                payouts: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new savings cycle with periods, obligations, and payout schedules.
   */
  static async createCycle(adminId: string, input: CreateCycleInput) {
    const group = await this.getActiveGroup();

    // 1. Prevent duplicate active cycles
    const activeCycle = await prisma.savingsCycle.findFirst({
      where: { groupId: group.id, status: CycleStatus.ACTIVE },
    });

    if (activeCycle) {
      throw new CycleServiceError(
        `Cycle ${activeCycle.cycleNumber} is currently ACTIVE. You must reconcile and complete the active cycle before creating a new one.`,
        409
      );
    }

    // 2. Validate that active members match group capacity and are assigned 1..N rotation seats
    const members = await prisma.member.findMany({
      where: { groupId: group.id, status: "ACTIVE" },
      orderBy: { rotationPosition: "asc" },
    });

    if (members.length < 2) {
      throw new CycleServiceError(
        `Group must have at least 2 active members to start a savings cycle. Currently found: ${members.length}.`,
        409
      );
    }

    if (members.length !== group.memberCount) {
      throw new CycleServiceError(
        `Group capacity is configured for ${group.memberCount} members, but currently has ${members.length} active members. Adjust group capacity in Settings or register all members.`,
        409
      );
    }

    const positions = members.map((m) => m.rotationPosition);
    const validPositions = Array.from({ length: members.length }, (_, i) => i + 1);
    const isOrdered = validPositions.every((pos, index) => positions[index] === pos);

    if (!isOrdered) {
      throw new CycleServiceError(
        `Members must be assigned strictly sequential rotation positions from 1 to ${members.length}.`,
        409
      );
    }

    // 3. Parse dates & deadlines
    const startDate = new Date(input.startDate);
    const dueDates = input.dueDates.map((d) => new Date(d));

    if (dueDates.length !== members.length) {
      throw new CycleServiceError(
        `Cycle requires exactly ${members.length} contribution deadlines (1 per period for each member's turn). Provided: ${dueDates.length}.`,
        400
      );
    }

    const contributionAmount = input.contributionAmountPesewas || group.contributionAmount;
    const monthlyTarget = input.monthlyTargetPesewas || (contributionAmount * members.length);
    const endDate = addMonths(startDate, members.length);

    return await prisma.$transaction(
      async (tx) => {
        // Compute next cycle number
        const lastCycle = await tx.savingsCycle.aggregate({
          where: { groupId: group.id },
          _max: { cycleNumber: true },
        });
        const cycleNumber = (lastCycle._max.cycleNumber ?? 0) + 1;

        // Create the cycle record
        const cycle = await tx.savingsCycle.create({
          data: {
            groupId: group.id,
            cycleNumber,
            startDate,
            endDate,
            status: CycleStatus.ACTIVE,
            contributionAmount,
            monthlyTarget,
          },
        });

        const allObligations: {
          id: string;
          periodId: string;
          memberId: string;
          amount: number;
          paidAmount: number;
          outstandingAmount: number;
          status: ContributionStatus;
        }[] = [];

        const allPayoutSchedules: {
          id: string;
          cycleId: string;
          periodId: string;
          memberId: string;
          rotationPosition: number;
          expectedAmount: number;
          scheduledDate: Date;
          status: PayoutStatus;
        }[] = [];

        // Generate N monthly contribution periods
        for (let i = 0; i < members.length; i++) {
          const periodNumber = i + 1;
          const periodStart = addMonths(startDate, i);
          const dueDate = dueDates[i];
          // Close date is set to the end of that period month or aligned with deadline
          const closeDate = addMonths(periodStart, 1);

          const period = await tx.contributionPeriod.create({
            data: {
              cycleId: cycle.id,
              periodNumber,
              startDate: periodStart,
              dueDate,
              closeDate,
              deadlineConfiguredBy: adminId,
              amount: contributionAmount,
            },
          });

          // Generate 1 obligation per member (N obligations per period)
          for (const member of members) {
            allObligations.push({
              id: randomUUID(),
              periodId: period.id,
              memberId: member.id,
              amount: contributionAmount,
              paidAmount: 0,
              outstandingAmount: contributionAmount,
              status: ContributionStatus.PENDING,
            });
          }

          // Generate fixed Payout Schedule for this period
          // Period i -> Member i
          const recipientMember = members[i];
          allPayoutSchedules.push({
            id: randomUUID(),
            cycleId: cycle.id,
            periodId: period.id,
            memberId: recipientMember.id,
            rotationPosition: periodNumber,
            expectedAmount: monthlyTarget,
            scheduledDate: dueDate,
            status: PayoutStatus.SCHEDULED,
          });
        }

        // Batch insert all obligations in ONE query
        await tx.contributionObligation.createMany({
          data: allObligations,
        });

        // Batch insert all payout schedules in ONE query
        await tx.payoutSchedule.createMany({
          data: allPayoutSchedules,
        });

        // Record in audit log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "CYCLE_CREATED",
            entityType: "SavingsCycle",
            entityId: cycle.id,
            newValues: {
              cycleNumber,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              dueDates: dueDates.map((d) => d.toISOString()),
              contributionAmount,
              monthlyTarget,
            },
          },
        });

        return cycle;
      },
      { timeout: 30000, maxWait: 10000 }
    );
  }

  /**
   * Activate a draft cycle.
   */
  static async activateCycle(adminId: string, cycleId: string) {
    const cycle = await prisma.savingsCycle.findUnique({
      where: { id: cycleId },
      include: { periods: true },
    });

    if (!cycle) {
      throw new CycleServiceError("Cycle not found.", 404);
    }

    if (cycle.status === CycleStatus.ACTIVE) {
      return cycle;
    }

    // Verify no conflicting active cycle
    const conflictingActive = await prisma.savingsCycle.findFirst({
      where: {
        groupId: cycle.groupId,
        status: CycleStatus.ACTIVE,
        id: { not: cycleId },
      },
    });

    if (conflictingActive) {
      throw new CycleServiceError(
        `Cycle ${conflictingActive.cycleNumber} is already ACTIVE. Complete or reconcile it first.`,
        409
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.savingsCycle.update({
        where: { id: cycleId },
        data: { status: CycleStatus.ACTIVE },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "CYCLE_ACTIVATED",
          entityType: "SavingsCycle",
          entityId: cycleId,
          oldValues: { status: cycle.status },
          newValues: { status: CycleStatus.ACTIVE },
        },
      });

      return updated;
    });
  }

  /**
   * Update contribution deadline for an open period.
   * Safeguard: Closed periods cannot have their historical deadline modified.
   */
  static async updatePeriodDeadline(
    adminId: string,
    periodId: string,
    input: UpdateDeadlineInput
  ) {
    const period = await prisma.contributionPeriod.findUnique({
      where: { id: periodId },
      include: { cycle: true, payoutSchedules: true },
    });

    if (!period) {
      throw new CycleServiceError("Contribution period not found.", 404);
    }

    // Protection rule from Part A Section 2:
    // "Changing a future deadline must not silently change the deadline of a closed period."
    if (period.closeDate < new Date() || period.cycle.status === CycleStatus.COMPLETED) {
      throw new CycleServiceError(
        "Cannot modify the deadline of a closed or completed period. Historical records must be preserved.",
        400
      );
    }

    const newDueDate = new Date(input.newDueDate);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.contributionPeriod.update({
        where: { id: periodId },
        data: {
          dueDate: newDueDate,
          deadlineConfiguredBy: adminId,
        },
      });

      // Also align the payout schedule date if scheduled on deadline
      if (period.payoutSchedules.length > 0) {
        await tx.payoutSchedule.updateMany({
          where: { periodId, status: PayoutStatus.SCHEDULED },
          data: { scheduledDate: newDueDate },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "DEADLINE_UPDATED",
          entityType: "ContributionPeriod",
          entityId: periodId,
          oldValues: { dueDate: period.dueDate.toISOString() },
          newValues: {
            dueDate: newDueDate.toISOString(),
            reason: input.reason,
            periodNumber: period.periodNumber,
            cycleNumber: period.cycle.cycleNumber,
          },
        },
      });

      return updated;
    });
  }
}

