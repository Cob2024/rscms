import { prisma } from "@/lib/database/prisma";
import { Prisma, PaymentChannel, PaymentStatus, AccountType, LedgerDirection } from "@prisma/client";
import { deriveContributionStatus } from "@/lib/financial/contribution-status";
import {
  RecordManualPaymentInput,
  PaymentFilterInput,
  recordManualPaymentSchema,
  reversePaymentSchema,
} from "@/lib/validation/payment";

export class PaymentServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export class PaymentService {
  /**
   * Helper to resolve the active group or throw 404
   */
  private static async getActiveGroup() {
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });
    if (!group) {
      throw new PaymentServiceError("Active savings group not configured.", 404);
    }
    return group;
  }

  /**
   * Resolve or ensure standard chart of accounts (1010 Cash, 4010 Revenue)
   */
  private static async getOrCreateStandardLedgerAccounts(
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
      // Fallback: any active ASSET account or create 1010
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

    // 4010 Contribution Revenue (Revenue)
    let revenueAccount = await tx.ledgerAccount.findFirst({
      where: {
        groupId,
        code: "4010",
        type: AccountType.REVENUE,
        isActive: true,
      },
    });

    if (!revenueAccount) {
      // Fallback: any active REVENUE account or create 4010
      revenueAccount = await tx.ledgerAccount.findFirst({
        where: { groupId, type: AccountType.REVENUE, isActive: true },
      });
      if (!revenueAccount) {
        revenueAccount = await tx.ledgerAccount.create({
          data: {
            groupId,
            code: "4010",
            name: "Contribution Revenue",
            type: AccountType.REVENUE,
            description: "Recognized verified monthly member contributions",
          },
        });
      }
    }

    return { cashAccount, revenueAccount };
  }

  /**
   * Record a manual payment (Cash, MTN MoMo, Telecel Cash, AT Money, Bank transfer).
   * Supports immediate verification (with ledger posting) or recording as pending verification.
   */
  static async recordManualPayment(
    adminId: string,
    rawInput: RecordManualPaymentInput
  ) {
    const validated = recordManualPaymentSchema.parse(rawInput);
    const group = await this.getActiveGroup();

    // Verify member belongs to group
    const member = await prisma.member.findFirst({
      where: { id: validated.memberId, groupId: group.id },
    });
    if (!member) {
      throw new PaymentServiceError("Member not found in active savings group.", 404);
    }

    // Check duplicate reference in group
    const duplicateReference = await prisma.payment.findFirst({
      where: {
        groupId: group.id,
        reference: validated.reference,
      },
    });
    if (duplicateReference) {
      throw new PaymentServiceError(
        `Transaction reference "${validated.reference}" has already been recorded in this group.`,
        409
      );
    }

    // Execute atomic transaction with serializable isolation
    return await prisma.$transaction(
      async (tx) => {
        // Find obligation
        const obligation = await tx.contributionObligation.findFirst({
          where: {
            id: validated.obligationId,
            memberId: validated.memberId,
          },
          include: {
            period: true,
          },
        });

        if (!obligation) {
          throw new PaymentServiceError(
            "Target contribution obligation not found for this member.",
            404
          );
        }

        // Remaining balance invariant
        const remainingPesewas = obligation.amount - obligation.paidAmount;
        if (validated.amountPesewas > remainingPesewas) {
          const formattedExceeds = (validated.amountPesewas / 100).toFixed(2);
          const formattedRemaining = (remainingPesewas / 100).toFixed(2);
          throw new PaymentServiceError(
            `Payment amount (GH₵${formattedExceeds}) exceeds the remaining balance of GH₵${formattedRemaining} for this obligation.`,
            400
          );
        }

        const isVerified = Boolean(validated.verifyImmediately);

        // 1. Create Payment record
        const payment = await tx.payment.create({
          data: {
            groupId: group.id,
            memberId: validated.memberId,
            periodId: obligation.periodId,
            amount: validated.amountPesewas,
            channel: validated.channel as PaymentChannel,
            reference: validated.reference,
            notes: validated.notes || null,
            paymentDate: new Date(validated.paymentDate),
            status: isVerified ? PaymentStatus.VERIFIED : PaymentStatus.PENDING,
            verifiedAt: isVerified ? new Date() : null,
            verifiedBy: isVerified ? adminId : null,
          },
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
              select: {
                id: true,
                periodNumber: true,
                dueDate: true,
              },
            },
          },
        });

        // 2. If verified immediately, allocate to obligation, update status, and post ledger transaction
        if (isVerified) {
          // Create allocation
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              obligationId: obligation.id,
              amount: validated.amountPesewas,
            },
          });

          // Update obligation status
          const updatedPaid = obligation.paidAmount + validated.amountPesewas;
          const updatedOutstanding = Math.max(0, obligation.amount - updatedPaid);
          const updatedStatus = deriveContributionStatus(
            obligation.amount,
            updatedPaid,
            obligation.period.dueDate
          );

          await tx.contributionObligation.update({
            where: { id: obligation.id },
            data: {
              paidAmount: updatedPaid,
              outstandingAmount: updatedOutstanding,
              status: updatedStatus,
            },
          });

          // Post balanced double-entry ledger transaction
          const { cashAccount, revenueAccount } =
            await this.getOrCreateStandardLedgerAccounts(tx, group.id);

          const ledgerReference = `TXN-PAY-${payment.id.slice(0, 8).toUpperCase()}`;

          await tx.ledgerTransaction.create({
            data: {
              groupId: group.id,
              reference: ledgerReference,
              transactionType: "CONTRIBUTION",
              description: `Contribution payment of GH₵${(validated.amountPesewas / 100).toFixed(2)} from ${member.fullName} via ${validated.channel} (Ref: ${validated.reference})`,
              sourceType: "Payment",
              sourceId: payment.id,
              createdBy: adminId,
              entries: {
                create: [
                  {
                    accountId: cashAccount.id,
                    direction: LedgerDirection.DEBIT,
                    amount: validated.amountPesewas,
                  },
                  {
                    accountId: revenueAccount.id,
                    direction: LedgerDirection.CREDIT,
                    amount: validated.amountPesewas,
                  },
                ],
              },
            },
          });

          // Create audit log
          await tx.auditLog.create({
            data: {
              userId: adminId,
              action: "PAYMENT_RECORDED_AND_VERIFIED",
              entityType: "Payment",
              entityId: payment.id,
              newValues: {
                amountPesewas: payment.amount,
                channel: payment.channel,
                reference: payment.reference,
                status: payment.status,
                obligationId: obligation.id,
                periodNumber: obligation.period.periodNumber,
              },
            },
          });
        } else {
          // Record pending audit log
          await tx.auditLog.create({
            data: {
              userId: adminId,
              action: "PAYMENT_RECORDED_PENDING",
              entityType: "Payment",
              entityId: payment.id,
              newValues: {
                amountPesewas: payment.amount,
                channel: payment.channel,
                reference: payment.reference,
                status: payment.status,
                obligationId: obligation.id,
                periodNumber: obligation.period.periodNumber,
              },
            },
          });
        }

        return payment;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Verify an existing pending payment.
   * Allocates to the obligation, recalculates obligation balance, and posts balanced ledger entries.
   */
  static async verifyPayment(
    adminId: string,
    paymentId: string,
    targetObligationId?: string
  ) {
    return await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            member: true,
          },
        });

        if (!payment) {
          throw new PaymentServiceError("Payment not found.", 404);
        }

        if (payment.status !== PaymentStatus.PENDING) {
          throw new PaymentServiceError(
            `Payment cannot be verified because its current status is ${payment.status}.`,
            400
          );
        }

        // Determine target obligation
        let obligationId = targetObligationId;
        if (!obligationId && payment.periodId) {
          const match = await tx.contributionObligation.findFirst({
            where: {
              memberId: payment.memberId,
              periodId: payment.periodId,
            },
            select: { id: true },
          });
          obligationId = match?.id;
        }

        if (!obligationId) {
          throw new PaymentServiceError(
            "Target contribution obligation must be specified to verify this payment.",
            400
          );
        }

        const obligation = await tx.contributionObligation.findFirst({
          where: {
            id: obligationId,
            memberId: payment.memberId,
          },
          include: {
            period: true,
          },
        });

        if (!obligation) {
          throw new PaymentServiceError(
            "Matching contribution obligation not found for this payment.",
            404
          );
        }

        const remainingPesewas = obligation.amount - obligation.paidAmount;
        if (payment.amount > remainingPesewas) {
          const formattedExceeds = (payment.amount / 100).toFixed(2);
          const formattedRemaining = (remainingPesewas / 100).toFixed(2);
          throw new PaymentServiceError(
            `Payment amount (GH₵${formattedExceeds}) exceeds remaining obligation balance of GH₵${formattedRemaining}.`,
            400
          );
        }

        // Create allocation
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            obligationId: obligation.id,
            amount: payment.amount,
          },
        });

        // Update obligation
        const newPaid = obligation.paidAmount + payment.amount;
        const newOutstanding = Math.max(0, obligation.amount - newPaid);
        const newStatus = deriveContributionStatus(
          obligation.amount,
          newPaid,
          obligation.period.dueDate
        );

        await tx.contributionObligation.update({
          where: { id: obligation.id },
          data: {
            paidAmount: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });

        // Post balanced double-entry ledger transaction
        const { cashAccount, revenueAccount } =
          await this.getOrCreateStandardLedgerAccounts(tx, payment.groupId);

        const ledgerReference = `TXN-PAY-${payment.id.slice(0, 8).toUpperCase()}`;

        await tx.ledgerTransaction.create({
          data: {
            groupId: payment.groupId,
            reference: ledgerReference,
            transactionType: "CONTRIBUTION",
            description: `Verified contribution receipt ${payment.reference || payment.id} from ${payment.member.fullName}`,
            sourceType: "Payment",
            sourceId: payment.id,
            createdBy: adminId,
            entries: {
              create: [
                {
                  accountId: cashAccount.id,
                  direction: LedgerDirection.DEBIT,
                  amount: payment.amount,
                },
                {
                  accountId: revenueAccount.id,
                  direction: LedgerDirection.CREDIT,
                  amount: payment.amount,
                },
              ],
            },
          },
        });

        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: adminId,
          },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                rotationPosition: true,
              },
            },
            period: true,
            allocations: true,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYMENT_VERIFIED",
            entityType: "Payment",
            entityId: payment.id,
            newValues: {
              status: PaymentStatus.VERIFIED,
              obligationId: obligation.id,
              amountPesewas: payment.amount,
            },
          },
        });

        return updatedPayment;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * Reverse a verified payment with an explicit administrative reason.
   * Posts balanced reversing double-entry entries (Debit 4010, Credit 1010),
   * rolls back obligation paidAmount, recomputes status, and marks payment REVERSED.
   */
  static async reversePayment(
    adminId: string,
    paymentId: string,
    rawReason: string
  ) {
    const { reason } = reversePaymentSchema.parse({ reason: rawReason });

    return await prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            member: true,
            allocations: {
              include: {
                obligation: {
                  include: {
                    period: true,
                  },
                },
              },
            },
          },
        });

        if (!payment) {
          throw new PaymentServiceError("Payment not found.", 404);
        }

        if (payment.status === PaymentStatus.REVERSED) {
          throw new PaymentServiceError(
            "This payment has already been reversed.",
            409
          );
        }

        if (payment.status !== PaymentStatus.VERIFIED) {
          throw new PaymentServiceError(
            `Only verified payments can be reversed. Current status: ${payment.status}`,
            400
          );
        }

        // Roll back obligation balances for each allocation
        for (const allocation of payment.allocations) {
          const obligation = allocation.obligation;
          const rolledBackPaid = Math.max(0, obligation.paidAmount - allocation.amount);
          const rolledBackOutstanding = obligation.amount - rolledBackPaid;
          const rolledBackStatus = deriveContributionStatus(
            obligation.amount,
            rolledBackPaid,
            obligation.period.dueDate
          );

          await tx.contributionObligation.update({
            where: { id: obligation.id },
            data: {
              paidAmount: rolledBackPaid,
              outstandingAmount: rolledBackOutstanding,
              status: rolledBackStatus,
            },
          });
        }

        // Post balanced reversing double-entry ledger entry
        // DEBIT 4010 (Revenue), CREDIT 1010 (Cash Asset)
        const { cashAccount, revenueAccount } =
          await this.getOrCreateStandardLedgerAccounts(tx, payment.groupId);

        const reversalReference = `TXN-REV-${payment.id.slice(0, 8).toUpperCase()}`;

        await tx.ledgerTransaction.create({
          data: {
            groupId: payment.groupId,
            reference: reversalReference,
            transactionType: "REVERSAL",
            description: `Payment Reversal: ${payment.reference || payment.id} (${payment.member.fullName}). Reason: ${reason}`,
            sourceType: "PaymentReversal",
            sourceId: payment.id,
            createdBy: adminId,
            entries: {
              create: [
                {
                  accountId: revenueAccount.id,
                  direction: LedgerDirection.DEBIT,
                  amount: payment.amount,
                },
                {
                  accountId: cashAccount.id,
                  direction: LedgerDirection.CREDIT,
                  amount: payment.amount,
                },
              ],
            },
          },
        });

        // Update payment status and append reversal note
        const noteAddition = `[REVERSED on ${new Date().toISOString()}] Reason: ${reason}`;
        const updatedNotes = payment.notes
          ? `${payment.notes}\n${noteAddition}`
          : noteAddition;

        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REVERSED,
            notes: updatedNotes,
          },
          include: {
            member: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                rotationPosition: true,
              },
            },
            period: true,
            allocations: true,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PAYMENT_REVERSED",
            entityType: "Payment",
            entityId: payment.id,
            oldValues: {
              status: PaymentStatus.VERIFIED,
              amountPesewas: payment.amount,
            },
            newValues: {
              status: PaymentStatus.REVERSED,
              reason,
            },
          },
        });

        return updatedPayment;
      },
      { isolationLevel: "Serializable" }
    );
  }

  /**
   * List payments with filtering, search, and aggregate metrics.
   */
  static async listPayments(filters?: PaymentFilterInput) {
    const group = await this.getActiveGroup();

    const where: Prisma.PaymentWhereInput = {
      groupId: group.id,
    };

    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.channel) {
      where.channel = filters.channel as PaymentChannel;
    }

    if (filters?.status) {
      where.status = filters.status as PaymentStatus;
    }

    if (filters?.periodId) {
      where.periodId = filters.periodId;
    }

    if (filters?.q) {
      where.OR = [
        { reference: { contains: filters.q, mode: "insensitive" } },
        { notes: { contains: filters.q, mode: "insensitive" } },
        { member: { fullName: { contains: filters.q, mode: "insensitive" } } },
      ];
    }

    const [payments, aggregateStats] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
        take: filters?.limit || 100,
        skip: filters ? (filters.page - 1) * filters.limit : 0,
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
            select: {
              id: true,
              periodNumber: true,
              dueDate: true,
            },
          },
          verifier: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          allocations: {
            include: {
              obligation: {
                select: {
                  id: true,
                  amount: true,
                  paidAmount: true,
                  outstandingAmount: true,
                  status: true,
                  period: {
                    select: {
                      periodNumber: true,
                      dueDate: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where: { groupId: group.id },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    let totalVerifiedPesewas = 0;
    let totalPendingPesewas = 0;
    let totalReversedPesewas = 0;
    let totalReceiptsCount = 0;

    for (const stat of aggregateStats) {
      totalReceiptsCount += stat._count.id;
      const sum = stat._sum.amount || 0;
      if (stat.status === PaymentStatus.VERIFIED) {
        totalVerifiedPesewas += sum;
      } else if (stat.status === PaymentStatus.PENDING) {
        totalPendingPesewas += sum;
      } else if (stat.status === PaymentStatus.REVERSED) {
        totalReversedPesewas += sum;
      }
    }

    return {
      payments,
      stats: {
        totalVerifiedPesewas,
        totalPendingPesewas,
        totalReversedPesewas,
        totalReceiptsCount,
      },
    };
  }

  /**
   * Get single payment details with allocations and ledger entries.
   */
  static async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            rotationPosition: true,
          },
        },
        period: true,
        verifier: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        allocations: {
          include: {
            obligation: {
              include: {
                period: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment record not found.", 404);
    }

    // Also fetch associated ledger transactions
    const ledgerTransactions = await prisma.ledgerTransaction.findMany({
      where: {
        sourceId: payment.id,
      },
      include: {
        entries: {
          include: {
            account: true,
          },
        },
      },
    });

    return {
      payment,
      ledgerTransactions,
    };
  }

  /**
   * Helper data for populating payment creation forms.
   * Fetches active members and active cycle obligations.
   */
  static async getFormData() {
    const group = await this.getActiveGroup();

    const [members, activeCycle] = await Promise.all([
      prisma.member.findMany({
        where: { groupId: group.id, status: "ACTIVE" },
        orderBy: { rotationPosition: "asc" },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          rotationPosition: true,
        },
      }),
      prisma.savingsCycle.findFirst({
        where: { groupId: group.id, status: "ACTIVE" },
        include: {
          periods: {
            orderBy: { periodNumber: "asc" },
            include: {
              obligations: {
                include: {
                  member: {
                    select: {
                      id: true,
                      fullName: true,
                      rotationPosition: true,
                    },
                  },
                },
                orderBy: { member: { rotationPosition: "asc" } },
              },
            },
          },
        },
      }),
    ]);

    const obligations =
      activeCycle?.periods.flatMap((p) =>
        p.obligations.map((o) => ({
          id: o.id,
          periodId: p.id,
          periodNumber: p.periodNumber,
          dueDate: p.dueDate,
          memberId: o.memberId,
          memberName: o.member.fullName,
          rotationPosition: o.member.rotationPosition,
          amount: o.amount,
          paidAmount: o.paidAmount,
          outstandingAmount: o.outstandingAmount,
          status: o.status,
        }))
      ) || [];

    return {
      group: {
        id: group.id,
        name: group.name,
        contributionAmount: group.contributionAmount,
      },
      members,
      obligations,
    };
  }
}

