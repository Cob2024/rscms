import { prisma } from "@/lib/database/prisma";
import { Prisma, ContributionStatus } from "@prisma/client";
import { deriveContributionStatus, DerivedContributionStatus } from "@/lib/financial/contribution-status";

export class ContributionServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ContributionServiceError";
    this.statusCode = statusCode;
  }
}

export interface ObligationWithStatus {
  id: string;
  periodId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  rotationPosition: number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: DerivedContributionStatus;
  allocations: {
    id: string;
    amount: number;
    paymentId: string;
    paymentDate: Date;
    channel: string;
    reference: string | null;
  }[];
}

export interface PeriodOverview {
  id: string;
  periodNumber: number;
  startDate: Date;
  dueDate: Date;
  closeDate: Date;
  isOverdue: boolean;
  expectedPesewas: number;
  verifiedPesewas: number;
  outstandingPesewas: number;
  shortfallPesewas: number;
  obligations: ObligationWithStatus[];
}

export class ContributionService {
  /**
   * Get the complete contribution overview for the active cycle.
   */
  static async getOverview(asOf = new Date()) {
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });

    if (!group) {
      return { cycle: null, periods: [], summary: null };
    }

    const activeCycle = await prisma.savingsCycle.findFirst({
      where: { groupId: group.id, status: "ACTIVE" },
      orderBy: { cycleNumber: "desc" },
      include: {
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            obligations: {
              include: {
                member: {
                  select: { id: true, fullName: true, phoneNumber: true, rotationPosition: true },
                },
                allocations: {
                  include: {
                    payment: {
                      select: {
                        id: true,
                        paymentDate: true,
                        channel: true,
                        reference: true,
                        status: true,
                      },
                    },
                  },
                },
              },
              orderBy: { member: { rotationPosition: "asc" } },
            },
          },
        },
      },
    });

    if (!activeCycle) {
      return { cycle: null, periods: [], summary: null };
    }

    const periodsOverview: PeriodOverview[] = activeCycle.periods.map((period) => {
      const isPeriodPastDeadline = asOf.getTime() > period.dueDate.getTime();

      const obligationsWithDerived: ObligationWithStatus[] = period.obligations.map((ob) => {
        // Only count verified payment allocations
        const verifiedAllocations = ob.allocations.filter(
          (a) => a.payment.status === "VERIFIED"
        );
        const verifiedPaid = verifiedAllocations.reduce((sum, a) => sum + a.amount, 0);
        const derivedStatus = deriveContributionStatus(
          ob.amount,
          verifiedPaid,
          period.dueDate,
          asOf
        );
        const outstanding = Math.max(0, ob.amount - verifiedPaid);

        return {
          id: ob.id,
          periodId: ob.periodId,
          memberId: ob.memberId,
          memberName: ob.member.fullName,
          memberPhone: ob.member.phoneNumber,
          rotationPosition: ob.member.rotationPosition,
          amount: ob.amount,
          paidAmount: verifiedPaid,
          outstandingAmount: outstanding,
          status: derivedStatus,
          allocations: verifiedAllocations.map((a) => ({
            id: a.id,
            amount: a.amount,
            paymentId: a.payment.id,
            paymentDate: a.payment.paymentDate,
            channel: a.payment.channel,
            reference: a.payment.reference,
          })),
        };
      });

      const expectedPesewas = obligationsWithDerived.reduce((sum, o) => sum + o.amount, 0);
      const verifiedPesewas = obligationsWithDerived.reduce((sum, o) => sum + o.paidAmount, 0);
      const outstandingPesewas = obligationsWithDerived.reduce(
        (sum, o) => sum + o.outstandingAmount,
        0
      );
      const shortfallPesewas = isPeriodPastDeadline ? outstandingPesewas : 0;

      return {
        id: period.id,
        periodNumber: period.periodNumber,
        startDate: period.startDate,
        dueDate: period.dueDate,
        closeDate: period.closeDate,
        isOverdue: isPeriodPastDeadline,
        expectedPesewas,
        verifiedPesewas,
        outstandingPesewas,
        shortfallPesewas,
        obligations: obligationsWithDerived,
      };
    });

    const totalExpectedPesewas = periodsOverview.reduce((sum, p) => sum + p.expectedPesewas, 0);
    const totalVerifiedPesewas = periodsOverview.reduce((sum, p) => sum + p.verifiedPesewas, 0);
    const totalOutstandingPesewas = periodsOverview.reduce((sum, p) => sum + p.outstandingPesewas, 0);
    const totalShortfallPesewas = periodsOverview.reduce((sum, p) => sum + p.shortfallPesewas, 0);

    return {
      cycle: {
        id: activeCycle.id,
        cycleNumber: activeCycle.cycleNumber,
        status: activeCycle.status,
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        contributionAmount: activeCycle.contributionAmount,
        monthlyTarget: activeCycle.monthlyTarget,
      },
      summary: {
        totalExpectedPesewas,
        totalVerifiedPesewas,
        totalOutstandingPesewas,
        totalShortfallPesewas,
        collectionRatePercent:
          totalExpectedPesewas > 0
            ? Math.round((totalVerifiedPesewas / totalExpectedPesewas) * 100)
            : 0,
      },
      periods: periodsOverview,
    };
  }

  /**
   * Get details for a single contribution obligation.
   */
  static async getObligationById(id: string, asOf = new Date()) {
    const obligation = await prisma.contributionObligation.findUnique({
      where: { id },
      include: {
        member: {
          select: { id: true, fullName: true, phoneNumber: true, rotationPosition: true, email: true },
        },
        period: {
          include: {
            cycle: {
              select: { id: true, cycleNumber: true, status: true },
            },
          },
        },
        allocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!obligation) {
      throw new ContributionServiceError("Contribution obligation not found.", 404);
    }

    const verifiedAllocations = obligation.allocations.filter(
      (a) => a.payment.status === "VERIFIED"
    );
    const verifiedPaid = verifiedAllocations.reduce((sum, a) => sum + a.amount, 0);
    const status = deriveContributionStatus(
      obligation.amount,
      verifiedPaid,
      obligation.period.dueDate,
      asOf
    );

    return {
      obligation: {
        id: obligation.id,
        amount: obligation.amount,
        paidAmount: verifiedPaid,
        outstandingAmount: Math.max(0, obligation.amount - verifiedPaid),
        status,
        member: obligation.member,
        period: obligation.period,
        allocations: verifiedAllocations,
      },
    };
  }

  /**
   * Helper to allocate a verified payment amount to an obligation inside a database transaction.
   * Enforces that an obligation is never overpaid through ordinary allocation.
   */
  static async allocateToObligation(
    tx: Prisma.TransactionClient,
    paymentId: string,
    obligationId: string,
    allocationAmountPesewas: number,
    dueDate: Date
  ) {
    if (!Number.isSafeInteger(allocationAmountPesewas) || allocationAmountPesewas <= 0) {
      throw new ContributionServiceError("Allocation amount must be a positive integer in pesewas.", 400);
    }

    const obligation = await tx.contributionObligation.findUnique({
      where: { id: obligationId },
    });

    if (!obligation) {
      throw new ContributionServiceError("Obligation not found for allocation.", 404);
    }

    const currentPaid = obligation.paidAmount;
    const remainingUnpaid = Math.max(0, obligation.amount - currentPaid);

    if (allocationAmountPesewas > remainingUnpaid) {
      throw new ContributionServiceError(
        `Allocation of ${allocationAmountPesewas} pesewas exceeds remaining obligation balance of ${remainingUnpaid} pesewas.`,
        400
      );
    }

    const newPaidAmount = currentPaid + allocationAmountPesewas;
    const newOutstanding = Math.max(0, obligation.amount - newPaidAmount);
    const derivedStatus = deriveContributionStatus(obligation.amount, newPaidAmount, dueDate);

    // Map derived status to schema ContributionStatus enum
    let dbStatus: ContributionStatus = ContributionStatus.PENDING;
    if (derivedStatus === "PAID") dbStatus = ContributionStatus.PAID;
    else if (derivedStatus === "PARTIAL") dbStatus = ContributionStatus.PARTIAL;
    else if (derivedStatus === "OVERDUE") dbStatus = ContributionStatus.OVERDUE;
    else if (derivedStatus === "OVERDUE_PARTIAL") dbStatus = ContributionStatus.OVERDUE_PARTIAL;

    // Create allocation record
    const allocation = await tx.paymentAllocation.create({
      data: {
        paymentId,
        obligationId,
        amount: allocationAmountPesewas,
      },
    });

    // Update obligation state
    await tx.contributionObligation.update({
      where: { id: obligationId },
      data: {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
        status: dbStatus,
      },
    });

    return allocation;
  }
}

