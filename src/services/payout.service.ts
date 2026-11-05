import { prisma } from "@/lib/database/prisma";
import {
  Prisma,
  PayoutStatus,
  PaymentChannel,
  ResolutionType,
  AccountType,
  LedgerDirection,
} from "@prisma/client";
import {
  AuthorizePayoutInput,
  DisbursePayoutInput,
  AcknowledgePayoutInput,
  PostponePayoutInput,
  authorizePayoutSchema,
  disbursePayoutSchema,
  acknowledgePayoutSchema,
  postponePayoutSchema,
} from "@/lib/validation/payout";
import { formatPesewas } from "@/lib/formatting/currency";

export class PayoutServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PayoutServiceError";
    this.statusCode = statusCode;
  }
}

export class PayoutService {
  /**
   * Helper to resolve the active group or throw 404
   */
  private static async getActiveGroup() {
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });
    if (!group) {
      throw new PayoutServiceError("Active savings group not configured.", 404);
    }
    return group;
  }

  /**
   * Resolve or ensure standard chart of accounts for payouts (1010 Cash, 5010 Expense / 2010 Liability)
   */
  private static async getOrCreatePayoutLedgerAccounts(
    tx: Prisma.TransactionClient,
    groupId: string
  ) {
    // 1010 Cash & Clearing (Asset)
    let cashAccount = await tx.ledgerAccount.findFirst({
      where: {
        groupId,
        code: "1010",
        type: AccountType.ASSET,
        isActive: true,
      },
    });

    if (!cashAccount) {
      cashAccount = await tx.ledgerAccount.findFirst({
        where: { groupId, type: AccountType.ASSET, isActive: true },
      });
      if (!cashAccount) {
        cashAccount = await tx.ledgerAccount.create({
          data: {
            groupId,
            code: "1010",
            name: "Cash & Clearing Account",
            type: AccountType.ASSET,
            description: "Group bank, cash, and mobile money clearing account",
          },
        });
      }
    }

    // 5010 Payout Disbursements (Expense) or 2010 Member Payout Obligations (Liability)
    let payoutAccount = await tx.ledgerAccount.findFirst({
      where: {
        groupId,
        code: { in: ["5010", "2010"] },
        isActive: true,
      },
      orderBy: { code: "desc" }, // prefers 5010
    });

    if (!payoutAccount) {
      payoutAccount = await tx.ledgerAccount.findFirst({
        where: {
          groupId,
          type: { in: [AccountType.EXPENSE, AccountType.LIABILITY] },
          isActive: true,
        },
      });
      if (!payoutAccount) {
        payoutAccount = await tx.ledgerAccount.create({
          data: {
            groupId,
            code: "5010",
            name: "Payout Disbursements",
            type: AccountType.EXPENSE,
            description: "Completed payout distributions to rotation recipients",
          },
        });
      }
    }

    return { cashAccount, payoutAccount };
  }

  /**
   * Calculate group verified available balance from asset ledger entries
   */
  static async getAvailableVerifiedBalance(
    txOrPrisma: Prisma.TransactionClient | typeof prisma,
    groupId: string
  ): Promise<number> {
    const entries = await txOrPrisma.ledgerEntry.findMany({
      where: {
        transaction: { groupId },
        account: { type: AccountType.ASSET },
      },
      select: { amount: true, direction: true },
    });

    return entries.reduce(
      (sum, entry) =>
        sum + (entry.direction === LedgerDirection.DEBIT ? entry.amount : -entry.amount),
      0
    );
  }

  /**
   * Get the complete payout overview for the active cycle, including
   * rotation tracking, available funds, shortfall per period, and recipient details.
   */
  static async getOverview() {
    const group = await this.getActiveGroup();

    const [activeCycle, availablePesewas] = await Promise.all([
      prisma.savingsCycle.findFirst({
        where: { groupId: group.id, status: "ACTIVE" },
        orderBy: { cycleNumber: "desc" },
        include: {
          payoutSchedules: {
            orderBy: { rotationPosition: "asc" },
            include: {
              member: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                  rotationPosition: true,
                },
              },
              period: {
                include: {
                  obligations: {
                    include: {
                      allocations: {
                        where: { payment: { status: "VERIFIED" } },
                        select: { amount: true },
                      },
                    },
                  },
                },
              },
              payouts: {
                orderBy: { createdAt: "desc" },
                include: {
                  authorizer: { select: { fullName: true, email: true } },
                  disburser: { select: { fullName: true, email: true } },
                  acknowledger: { select: { fullName: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.getAvailableVerifiedBalance(prisma, group.id),
    ]);

    if (!activeCycle) {
      return {
        group: { id: group.id, name: group.name },
        cycle: null,
        schedules: [],
        availablePesewas,
        summary: {
          totalExpectedPesewas: 0,
          totalDisbursedPesewas: 0,
          totalOutstandingPesewas: 0,
          currentRecipient: null,
          nextRecipient: null,
        },
      };
    }

    let totalDisbursedPesewas = 0;
    let totalExpectedPesewas = 0;

    const schedulesWithMetrics = activeCycle.payoutSchedules.map((schedule) => {
      totalExpectedPesewas += schedule.expectedAmount;

      // Calculate period contribution shortfall
      const periodShortfall = schedule.period.obligations.reduce(
        (sum, obligation) => {
          const verifiedPaid = obligation.allocations.reduce(
            (paidSum, alloc) => paidSum + alloc.amount,
            0
          );
          return sum + Math.max(0, obligation.amount - verifiedPaid);
        },
        0
      );

      const activePayout = schedule.payouts[0] || null;
      if (activePayout && activePayout.actualAmount > 0) {
        totalDisbursedPesewas += activePayout.actualAmount;
      }

      // Check if previous rotation positions are completed
      let isRotationBlocked = false;
      if (schedule.rotationPosition > 1) {
        const earlierPositions = activeCycle.payoutSchedules.filter(
          (s) => s.rotationPosition < schedule.rotationPosition
        );
        isRotationBlocked = earlierPositions.some((s) => {
          const p = s.payouts[0];
          return (
            !p ||
            !(
              p.status === PayoutStatus.ACKNOWLEDGED ||
              (p.status === PayoutStatus.PARTIAL && p.acknowledgedAt)
            )
          );
        });
      }

      return {
        id: schedule.id,
        rotationPosition: schedule.rotationPosition,
        expectedAmount: schedule.expectedAmount,
        scheduledDate: schedule.scheduledDate,
        status: schedule.status,
        member: schedule.member,
        period: {
          id: schedule.period.id,
          periodNumber: schedule.period.periodNumber,
          dueDate: schedule.period.dueDate,
        },
        periodShortfall,
        activePayout,
        isRotationBlocked,
      };
    });

    // Identify current and next rotation recipients
    const pendingSchedule = schedulesWithMetrics.find(
      (s) => s.status === PayoutStatus.SCHEDULED || s.status === PayoutStatus.AUTHORIZED
    );
    const nextSchedule = schedulesWithMetrics.find(
      (s) =>
        s.status === PayoutStatus.SCHEDULED &&
        s.rotationPosition > (pendingSchedule?.rotationPosition || 0)
    );

    return {
      group: { id: group.id, name: group.name },
      cycle: {
        id: activeCycle.id,
        cycleNumber: activeCycle.cycleNumber,
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
      },
      schedules: schedulesWithMetrics,
      availablePesewas,
      summary: {
        totalExpectedPesewas,
        totalDisbursedPesewas,
        totalOutstandingPesewas: Math.max(0, totalExpectedPesewas - totalDisbursedPesewas),
        currentRecipient: pendingSchedule?.member || null,
        nextRecipient: nextSchedule?.member || null,
      },
    };
  }

  /**
   * Authorize a scheduled payout.
   * Checks rotation sequence, verifies liquidity against verified funds,
   * handles shortfall exception documentation, and creates Payout in AUTHORIZED status.
   */
  static async authorizePayout(
    adminId: string,
    scheduleId: string,
    rawInput: AuthorizePayoutInput
  ) {
    const validated = authorizePayoutSchema.parse(rawInput);

    return await prisma.$transaction(
      async (tx) => {
        const schedule = await tx.payoutSchedule.findUnique({
          where: { id: scheduleId },
          include: {
            member: true,
            cycle: { select: { id: true, groupId: true } },
            period: {
              include: {
                obligations: {
                  include: {
                    allocations: {
                      where: { payment: { status: "VERIFIED" } },
                      select: { amount: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!schedule) {
          throw new PayoutServiceError("Payout schedule not found.", 404);
        }

        if (
          schedule.status !== PayoutStatus.SCHEDULED &&
          schedule.status !== PayoutStatus.POSTPONED
        ) {
          throw new PayoutServiceError(
            `This payout position cannot be authorized because its status is ${schedule.status}.`,
            409
          );
        }

        // Strict Rotation Sequence Enforcement:
        // Position N cannot be authorized until positions 1 .. N-1 are acknowledged
        if (schedule.rotationPosition > 1) {
          const earlierSchedules = await tx.payoutSchedule.findMany({
            where: {
              cycleId: schedule.cycleId,
              rotationPosition: { lt: schedule.rotationPosition },
            },
            include: {
              payouts: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          });

          const uncompletedEarlier = earlierSchedules.find((item) => {
            const p = item.payouts[0];
            return (
              !p ||
              !(
                p.status === PayoutStatus.ACKNOWLEDGED ||
                (p.status === PayoutStatus.PARTIAL && p.acknowledgedAt)
              )
            );
          });

          if (uncompletedEarlier) {
            throw new PayoutServiceError(
              `Rotation position ${schedule.rotationPosition} cannot be authorized until position ${uncompletedEarlier.rotationPosition} has been fully disbursed and acknowledged.`,
              409
            );
          }
        }

        // Amount invariants
        if (validated.amountPesewas > schedule.expectedAmount) {
          throw new PayoutServiceError(
            `Authorized amount (${formatPesewas(validated.amountPesewas)}) cannot exceed the expected payout (${formatPesewas(schedule.expectedAmount)}).`,
            400
          );
        }

        // Period shortfall check
        const periodShortfall = schedule.period.obligations.reduce(
          (sum, obligation) => {
            const paid = obligation.allocations.reduce(
              (pSum, alloc) => pSum + alloc.amount,
              0
            );
            return sum + Math.max(0, obligation.amount - paid);
          },
          0
        );

        const isPartial = validated.amountPesewas < schedule.expectedAmount;

        // Exception Safeguards
        if (isPartial || periodShortfall > 0) {
          if (!validated.resolutionType || !validated.reason) {
            throw new PayoutServiceError(
              "A documented resolution type and explanatory reason are required when authorizing a payout with outstanding period contributions or partial amounts.",
              400
            );
          }

          if (!validated.groupAuthorized) {
            throw new PayoutServiceError(
              "Administrative confirmation that the group authorized this exception is required before proceeding.",
              400
            );
          }

          if (isPartial && validated.resolutionType !== ResolutionType.PARTIAL_PAYOUT) {
            throw new PayoutServiceError(
              "A partial payout authorization must use the PARTIAL_PAYOUT resolution type.",
              400
            );
          }

          if (validated.resolutionType === ResolutionType.POSTPONE_PAYOUT) {
            throw new PayoutServiceError(
              "A postponed payout cannot be authorized. Use the postpone action instead.",
              400
            );
          }
        }

        // Available Verified Funds Invariant:
        // Payout must NEVER exceed group's available verified funds
        const availableFunds = await this.getAvailableVerifiedBalance(
          tx,
          schedule.cycle.groupId
        );

        if (validated.amountPesewas > availableFunds) {
          throw new PayoutServiceError(
            `Cannot authorize ${formatPesewas(validated.amountPesewas)}: group available verified balance is only ${formatPesewas(availableFunds)}.`,
            409
          );
        }

        // Create Payout in AUTHORIZED status
        const payout = await tx.payout.create({
          data: {
            scheduleId: schedule.id,
            memberId: schedule.memberId,
            expectedAmount: schedule.expectedAmount,
            authorizedAmount: validated.amountPesewas,
            outstandingAmount: schedule.expectedAmount - validated.amountPesewas,
            status: PayoutStatus.AUTHORIZED,
            authorizedAt: new Date(),
            authorizedBy: adminId,
            notes: validated.reason || null,
          },
        });

        // If shortfall or partial, record CycleResolution
        if (periodShortfall > 0 || isPartial) {
          await tx.cycleResolution.create({
            data: {
              periodId: schedule.periodId,
              resolutionType: validated.resolutionType!,
              affectedMemberId: schedule.memberId,
              outstandingAmount: periodShortfall,
              decisionDescription: `${validated.reason} (Group authorization confirmed: ${validated.groupAuthorized})`,
              approvedBy: adminId,
            },
          });
        }

        // Update schedule status
        await tx.payoutSchedule.update({
          where: { id: schedule.id },
          data: { status: PayoutStatus.AUTHORIZED },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYOUT_AUTHORIZED",
            entityType: "Payout",
            entityId: payout.id,
            newValues: {
              rotationPosition: schedule.rotationPosition,
              recipient: schedule.member.fullName,
              expectedAmount: payout.expectedAmount,
              authorizedAmount: payout.authorizedAmount,
              shortfall: periodShortfall,
              resolutionType: validated.resolutionType || null,
              groupAuthorized: validated.groupAuthorized,
            },
          },
        });

        return payout;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Disburse an authorized payout.
   * Posts balanced double-entry ledger entries (Debit Payout Disbursements 5010, Credit Cash 1010),
   * updates status to DISBURSED (or PARTIAL), and records transaction reference.
   */
  static async disbursePayout(
    adminId: string,
    payoutId: string,
    rawInput: DisbursePayoutInput
  ) {
    const validated = disbursePayoutSchema.parse(rawInput);

    return await prisma.$transaction(
      async (tx) => {
        const payout = await tx.payout.findUnique({
          where: { id: payoutId },
          include: {
            member: true,
            schedule: {
              include: {
                cycle: { select: { groupId: true } },
              },
            },
          },
        });

        if (!payout) {
          throw new PayoutServiceError("Payout record not found.", 404);
        }

        if (payout.status !== PayoutStatus.AUTHORIZED) {
          throw new PayoutServiceError(
            `Only authorized payouts can be disbursed. Current status: ${payout.status}`,
            409
          );
        }

        const groupId = payout.schedule.cycle.groupId;

        // Verify available funds
        const availableFunds = await this.getAvailableVerifiedBalance(tx, groupId);
        if (payout.authorizedAmount > availableFunds) {
          throw new PayoutServiceError(
            `Insufficient verified funds to disburse: available balance is ${formatPesewas(availableFunds)}, but disbursement requires ${formatPesewas(payout.authorizedAmount)}.`,
            409
          );
        }

        // Resolve standard ledger accounts: Cash (1010) & Payout Disbursements (5010 / 2010)
        const { cashAccount, payoutAccount } =
          await this.getOrCreatePayoutLedgerAccounts(tx, groupId);

        const ledgerReference = `TXN-DISBURSE-${payout.id.slice(0, 8).toUpperCase()}`;

        // Post balanced double-entry ledger transaction
        // DEBIT 5010 (Payout Disbursements Expense), CREDIT 1010 (Cash Asset)
        await tx.ledgerTransaction.create({
          data: {
            groupId,
            reference: ledgerReference,
            transactionType: "PAYOUT",
            description: `Payout disbursement of ${formatPesewas(payout.authorizedAmount)} to ${payout.member.fullName} via ${validated.channel} (Ref: ${validated.reference})`,
            sourceType: "Payout",
            sourceId: payout.id,
            createdBy: adminId,
            entries: {
              create: [
                {
                  accountId: payoutAccount.id,
                  direction: LedgerDirection.DEBIT,
                  amount: payout.authorizedAmount,
                },
                {
                  accountId: cashAccount.id,
                  direction: LedgerDirection.CREDIT,
                  amount: payout.authorizedAmount,
                },
              ],
            },
          },
        });

        const isFull = payout.authorizedAmount === payout.expectedAmount;
        const newStatus = isFull ? PayoutStatus.DISBURSED : PayoutStatus.PARTIAL;

        const updatedNotes = [
          payout.notes,
          validated.notes ? `Disbursement Note: ${validated.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        const updatedPayout = await tx.payout.update({
          where: { id: payout.id },
          data: {
            actualAmount: payout.authorizedAmount,
            outstandingAmount: payout.expectedAmount - payout.authorizedAmount,
            status: newStatus,
            channel: validated.channel as PaymentChannel,
            reference: validated.reference,
            disbursedAt: new Date(),
            disbursedBy: adminId,
            notes: updatedNotes || null,
          },
          include: {
            member: true,
            schedule: true,
          },
        });

        // Update schedule status
        await tx.payoutSchedule.update({
          where: { id: payout.scheduleId },
          data: { status: newStatus },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYOUT_DISBURSED",
            entityType: "Payout",
            entityId: payout.id,
            newValues: {
              actualAmount: updatedPayout.actualAmount,
              channel: updatedPayout.channel,
              reference: updatedPayout.reference,
              status: newStatus,
            },
          },
        });

        return updatedPayout;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Record recipient acknowledgement of a disbursed payout.
   * Recipient confirmation is tracked independently from the administrator's disbursement.
   */
  static async acknowledgePayout(
    adminId: string,
    payoutId: string,
    rawInput: AcknowledgePayoutInput
  ) {
    const validated = acknowledgePayoutSchema.parse(rawInput);

    return await prisma.$transaction(
      async (tx) => {
        const payout = await tx.payout.findUnique({
          where: { id: payoutId },
          include: { member: true },
        });

        if (!payout) {
          throw new PayoutServiceError("Payout record not found.", 404);
        }

        if (
          payout.status !== PayoutStatus.DISBURSED &&
          payout.status !== PayoutStatus.PARTIAL
        ) {
          throw new PayoutServiceError(
            `Only disbursed or partial payouts can be acknowledged. Current status: ${payout.status}`,
            409
          );
        }

        if (payout.acknowledgedAt) {
          throw new PayoutServiceError(
            "This payout has already been acknowledged by the recipient.",
            409
          );
        }

        const noteAddition = `[Recipient Acknowledgement recorded on ${new Date().toISOString()}]: ${validated.acknowledgement}`;
        const updatedNotes = payout.notes
          ? `${payout.notes}\n${noteAddition}`
          : noteAddition;

        const updatedPayout = await tx.payout.update({
          where: { id: payout.id },
          data: {
            status:
              payout.status === PayoutStatus.DISBURSED
                ? PayoutStatus.ACKNOWLEDGED
                : PayoutStatus.PARTIAL,
            acknowledgedAt: new Date(),
            acknowledgedBy: adminId,
            notes: updatedNotes,
          },
          include: { member: true },
        });

        // Update schedule
        await tx.payoutSchedule.update({
          where: { id: payout.scheduleId },
          data: { status: PayoutStatus.ACKNOWLEDGED },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYOUT_ACKNOWLEDGED",
            entityType: "Payout",
            entityId: payout.id,
            newValues: {
              recipient: payout.member.fullName,
              acknowledgedAt: updatedPayout.acknowledgedAt,
              acknowledgement: validated.acknowledgement,
            },
          },
        });

        return updatedPayout;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Postpone a payout position due to contribution shortfall.
   */
  static async postponePayout(
    adminId: string,
    scheduleId: string,
    rawInput: PostponePayoutInput
  ) {
    const validated = postponePayoutSchema.parse(rawInput);

    return await prisma.$transaction(
      async (tx) => {
        const schedule = await tx.payoutSchedule.findUnique({
          where: { id: scheduleId },
          include: {
            member: true,
            period: {
              include: {
                obligations: {
                  include: {
                    allocations: {
                      where: { payment: { status: "VERIFIED" } },
                      select: { amount: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!schedule) {
          throw new PayoutServiceError("Payout schedule not found.", 404);
        }

        if (
          schedule.status !== PayoutStatus.SCHEDULED &&
          schedule.status !== PayoutStatus.POSTPONED
        ) {
          throw new PayoutServiceError(
            `This payout position cannot be postponed because its status is ${schedule.status}.`,
            409
          );
        }

        const periodShortfall = schedule.period.obligations.reduce(
          (sum, obligation) => {
            const paid = obligation.allocations.reduce(
              (pSum, alloc) => pSum + alloc.amount,
              0
            );
            return sum + Math.max(0, obligation.amount - paid);
          },
          0
        );

        // Record CycleResolution
        await tx.cycleResolution.create({
          data: {
            periodId: schedule.periodId,
            resolutionType: ResolutionType.POSTPONE_PAYOUT,
            affectedMemberId: schedule.memberId,
            outstandingAmount: periodShortfall,
            decisionDescription: validated.reason,
            approvedBy: adminId,
          },
        });

        const updatedSchedule = await tx.payoutSchedule.update({
          where: { id: schedule.id },
          data: { status: PayoutStatus.POSTPONED },
          include: { member: true },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYOUT_POSTPONED",
            entityType: "PayoutSchedule",
            entityId: schedule.id,
            newValues: {
              recipient: schedule.member.fullName,
              shortfall: periodShortfall,
              reason: validated.reason,
            },
          },
        });

        return updatedSchedule;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Get payout details by ID including schedule, recipient, verifier, and ledger entries
   */
  static async getPayoutById(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            rotationPosition: true,
          },
        },
        schedule: {
          include: {
            period: true,
            cycle: true,
          },
        },
        authorizer: {
          select: { id: true, fullName: true, email: true },
        },
        disburser: {
          select: { id: true, fullName: true, email: true },
        },
        acknowledger: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!payout) {
      throw new PayoutServiceError("Payout record not found.", 404);
    }

    const ledgerTransactions = await prisma.ledgerTransaction.findMany({
      where: { sourceId: payout.id },
      include: {
        entries: {
          include: {
            account: true,
          },
        },
      },
    });

    return { payout, ledgerTransactions };
  }
}

