import { prisma } from "@/lib/database/prisma";
import { MemberStatus } from "@prisma/client";
import { CreateMemberInput, UpdateMemberInput } from "@/lib/validation/member";

export class MemberServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "MemberServiceError";
    this.statusCode = statusCode;
  }
}

export interface MemberFinancialSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  rotationPosition: number;
  status: MemberStatus;
  joinedAt: Date;
  totalObligationsPesewas: number;
  totalPaidPesewas: number;
  outstandingBalancePesewas: number;
  totalPayoutsPesewas: number;
}

export class MemberService {
  /**
   * Helper to resolve the active savings group.
   */
  private static async getActiveGroup() {
    const group = await prisma.savingsGroup.findFirst({
      where: { isActive: true },
    });
    if (!group) {
      throw new MemberServiceError("Active savings group not configured.", 404);
    }
    return group;
  }

  /**
   * List all members of the active group with financial summaries.
   */
  static async listMembers(): Promise<{
    group: { id: string; name: string; memberCount: number; contributionAmount: number };
    members: MemberFinancialSummary[];
  }> {
    const group = await this.getActiveGroup();

    const members = await prisma.member.findMany({
      where: { groupId: group.id },
      orderBy: { rotationPosition: "asc" },
      include: {
        obligations: {
          select: {
            amount: true,
            paidAmount: true,
            outstandingAmount: true,
            status: true,
          },
        },
        payouts: {
          where: { status: "DISBURSED" },
          select: {
            actualAmount: true,
          },
        },
      },
    });

    const summaries: MemberFinancialSummary[] = members.map((m) => {
      const totalObligationsPesewas = m.obligations.reduce((sum, o) => sum + o.amount, 0);
      const totalPaidPesewas = m.obligations.reduce((sum, o) => sum + o.paidAmount, 0);
      const outstandingBalancePesewas = m.obligations.reduce(
        (sum, o) => sum + Math.max(0, o.amount - o.paidAmount),
        0
      );
      const totalPayoutsPesewas = m.payouts.reduce((sum, p) => sum + p.actualAmount, 0);

      return {
        id: m.id,
        fullName: m.fullName,
        phoneNumber: m.phoneNumber,
        email: m.email,
        rotationPosition: m.rotationPosition,
        status: m.status,
        joinedAt: m.joinedAt,
        totalObligationsPesewas,
        totalPaidPesewas,
        outstandingBalancePesewas,
        totalPayoutsPesewas,
      };
    });

    return {
      group: {
        id: group.id,
        name: group.name,
        memberCount: group.memberCount,
        contributionAmount: group.contributionAmount,
      },
      members: summaries,
    };
  }

  /**
   * Get detailed profile, financial statements, obligations, and payout history for a single member.
   */
  static async getMemberById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        group: {
          select: { id: true, name: true, contributionAmount: true, currency: true },
        },
        obligations: {
          include: {
            period: {
              select: {
                periodNumber: true,
                startDate: true,
                dueDate: true,
                closeDate: true,
                cycle: {
                  select: { cycleNumber: true, status: true },
                },
              },
            },
            allocations: {
              include: {
                payment: {
                  select: {
                    paymentDate: true,
                    channel: true,
                    reference: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { period: { periodNumber: "asc" } },
        },
        payouts: {
          include: {
            schedule: {
              select: {
                period: {
                  select: { periodNumber: true },
                },
                cycle: {
                  select: { cycleNumber: true },
                },
                scheduledDate: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
      },
    });

    if (!member) {
      throw new MemberServiceError("Member not found.", 404);
    }

    const totalObligationsPesewas = member.obligations.reduce((sum, o) => sum + o.amount, 0);
    const totalPaidPesewas = member.obligations.reduce((sum, o) => sum + o.paidAmount, 0);
    const outstandingBalancePesewas = member.obligations.reduce(
      (sum, o) => sum + Math.max(0, o.amount - o.paidAmount),
      0
    );
    const totalPayoutsReceivedPesewas = member.payouts
      .filter((p) => p.status === "DISBURSED" || p.status === "ACKNOWLEDGED")
      .reduce((sum, p) => sum + p.actualAmount, 0);

    return {
      member: {
        id: member.id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        email: member.email,
        rotationPosition: member.rotationPosition,
        status: member.status,
        joinedAt: member.joinedAt,
        createdAt: member.createdAt,
        group: member.group,
      },
      financialSummary: {
        totalObligationsPesewas,
        totalPaidPesewas,
        outstandingBalancePesewas,
        totalPayoutsReceivedPesewas,
      },
      obligations: member.obligations,
      payouts: member.payouts,
      recentPayments: member.payments,
    };
  }

  /**
   * Register a new member into the group.
   */
  static async createMember(adminId: string, input: CreateMemberInput) {
    const group = await this.getActiveGroup();

    // Check current member count
    const count = await prisma.member.count({
      where: { groupId: group.id },
    });

    if (count >= group.memberCount) {
      throw new MemberServiceError(
        `Group has reached its maximum capacity of ${group.memberCount} members.`,
        409
      );
    }

    // Check if rotation position is already occupied
    const existingPosition = await prisma.member.findUnique({
      where: {
        groupId_rotationPosition: {
          groupId: group.id,
          rotationPosition: input.rotationPosition,
        },
      },
    });

    if (existingPosition) {
      throw new MemberServiceError(
        `Rotation position ${input.rotationPosition} is already assigned to ${existingPosition.fullName}.`,
        409
      );
    }

    // Check for duplicate phone number in group
    const existingPhone = await prisma.member.findFirst({
      where: {
        groupId: group.id,
        phoneNumber: input.phoneNumber,
      },
    });

    if (existingPhone) {
      throw new MemberServiceError(
        `A member with phone number ${input.phoneNumber} already exists in this group.`,
        409
      );
    }

    return await prisma.$transaction(async (tx) => {
      const created = await tx.member.create({
        data: {
          groupId: group.id,
          fullName: input.fullName,
          phoneNumber: input.phoneNumber,
          email: input.email || null,
          rotationPosition: input.rotationPosition,
          status: MemberStatus.ACTIVE,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "MEMBER_CREATED",
          entityType: "Member",
          entityId: created.id,
          newValues: {
            fullName: created.fullName,
            phoneNumber: created.phoneNumber,
            rotationPosition: created.rotationPosition,
            groupId: group.id,
          },
        },
      });

      return created;
    });
  }

  /**
   * Update member details (name, phone, email, rotation position).
   */
  static async updateMember(adminId: string, id: string, input: UpdateMemberInput) {
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new MemberServiceError("Member not found.", 404);
    }

    // If changing rotation position, verify that new position is not taken
    if (
      input.rotationPosition !== undefined &&
      input.rotationPosition !== existing.rotationPosition
    ) {
      const conflict = await prisma.member.findUnique({
        where: {
          groupId_rotationPosition: {
            groupId: existing.groupId,
            rotationPosition: input.rotationPosition,
          },
        },
      });

      if (conflict) {
        throw new MemberServiceError(
          `Rotation position ${input.rotationPosition} is already assigned to ${conflict.fullName}.`,
          409
        );
      }
    }

    // If changing phone number, check uniqueness
    if (input.phoneNumber && input.phoneNumber !== existing.phoneNumber) {
      const phoneConflict = await prisma.member.findFirst({
        where: {
          groupId: existing.groupId,
          phoneNumber: input.phoneNumber,
          id: { not: id },
        },
      });

      if (phoneConflict) {
        throw new MemberServiceError(
          `A member with phone number ${input.phoneNumber} already exists.`,
          409
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id },
        data: {
          ...(input.fullName ? { fullName: input.fullName } : {}),
          ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
          ...(input.email !== undefined ? { email: input.email || null } : {}),
          ...(input.rotationPosition !== undefined
            ? { rotationPosition: input.rotationPosition }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "MEMBER_UPDATED",
          entityType: "Member",
          entityId: id,
          oldValues: {
            fullName: existing.fullName,
            phoneNumber: existing.phoneNumber,
            email: existing.email,
            rotationPosition: existing.rotationPosition,
          },
          newValues: {
            fullName: updated.fullName,
            phoneNumber: updated.phoneNumber,
            email: updated.email,
            rotationPosition: updated.rotationPosition,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Update member status (ACTIVE, INACTIVE, SUSPENDED, LEFT).
   */
  static async updateMemberStatus(
    adminId: string,
    id: string,
    status: MemberStatus,
    reason?: string
  ) {
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new MemberServiceError("Member not found.", 404);
    }

    if (existing.status === status) {
      return existing;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id },
        data: {
          status,
          ...(status === MemberStatus.LEFT ? { leftAt: new Date() } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "MEMBER_STATUS_CHANGED",
          entityType: "Member",
          entityId: id,
          oldValues: { status: existing.status },
          newValues: { status: updated.status, reason: reason || null },
        },
      });

      return updated;
    });
  }

  /**
   * Safely delete a member, strictly forbidding deletion if financial history exists.
   */
  static async deleteMember(adminId: string, id: string) {
    const existing = await prisma.member.findUnique({
      where: { id },
      include: {
        payments: { select: { id: true }, take: 1 },
        obligations: {
          where: { paidAmount: { gt: 0 } },
          select: { id: true },
          take: 1,
        },
        payouts: { select: { id: true }, take: 1 },
        cycleResolutions: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      throw new MemberServiceError("Member not found.", 404);
    }

    // Protection rule: Never delete member with financial history
    const hasFinancialHistory =
      existing.payments.length > 0 ||
      existing.obligations.length > 0 ||
      existing.payouts.length > 0 ||
      existing.cycleResolutions.length > 0;

    if (hasFinancialHistory) {
      throw new MemberServiceError(
        "Cannot delete a member with existing financial history. Change status to INACTIVE or SUSPENDED to preserve the financial audit trail.",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Clean up any empty obligations if no payments were made
      await tx.contributionObligation.deleteMany({
        where: { memberId: id, paidAmount: 0 },
      });

      // Clean up empty payout schedules
      await tx.payoutSchedule.deleteMany({
        where: { memberId: id, payouts: { none: {} } },
      });

      const deleted = await tx.member.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: "MEMBER_DELETED",
          entityType: "Member",
          entityId: id,
          oldValues: {
            fullName: existing.fullName,
            rotationPosition: existing.rotationPosition,
          },
        },
      });

      return deleted;
    });
  }
}

