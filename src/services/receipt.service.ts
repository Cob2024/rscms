import { prisma } from "@/lib/database/prisma";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/date";
import { pesewasToWords } from "@/lib/formatting/words";

export class ReceiptServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ReceiptServiceError";
    this.statusCode = statusCode;
  }
}

export interface ReceiptData {
  receiptNumber: string;
  issuedAt: string;
  paymentId: string;
  group: {
    id: string;
    name: string;
    currency: string;
  };
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    rotationPosition: number;
  };
  payment: {
    amountPesewas: number;
    formattedAmount: string;
    amountInWords: string;
    channel: string;
    rawChannel: string;
    reference: string | null;
    paymentDate: string;
    status: string;
    verifiedAt: string | null;
    verifiedBy: string | null;
    notes: string | null;
  };
  period: {
    periodNumber: number;
    cycleNumber: number;
    dueDate: string | null;
    label: string;
  };
  obligation: {
    totalObligationPesewas: number;
    paidAmountPesewas: number;
    outstandingAmountPesewas: number;
    formattedOutstanding: string;
    isFullySettled: boolean;
  };
  dispatch: {
    whatsAppUrl: string;
    smsText: string;
    shareableUrl: string;
  };
}

export function formatChannelName(channel: string): string {
  switch (channel) {
    case "MTN_MOMO":
      return "MTN Mobile Money";
    case "TELECEL_CASH":
      return "Telecel Cash";
    case "AT_MONEY":
      return "AT Money";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CASH":
      return "Cash";
    default:
      return channel.replace(/_/g, " ");
  }
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }
  return digits;
}

export class ReceiptService {
  /**
   * Format database payment record into clean, presentation-ready receipt data.
   */
  static formatReceiptData(payment: any, baseUrl = "https://rscms.vercel.app"): ReceiptData {
    const receiptNumber = `RCP-${payment.id.slice(0, 8).toUpperCase()}`;
    const issuedAt = (payment.verifiedAt || payment.paymentDate || new Date()).toISOString();

    const formattedAmount = formatPesewas(payment.amount);
    const amountInWords = pesewasToWords(payment.amount);
    const channelName = formatChannelName(payment.channel);

    // Resolve period and cycle info
    const allocation = payment.allocations?.[0];
    const periodObj = payment.period || allocation?.obligation?.period;
    const periodNumber = periodObj?.periodNumber ?? 1;
    const cycleNumber = periodObj?.cycle?.cycleNumber ?? 1;
    const dueDate = periodObj?.dueDate ? periodObj.dueDate.toISOString() : null;
    const periodLabel = `Cycle ${cycleNumber}, Period ${periodNumber}`;

    // Resolve obligation balances
    const obligationObj = allocation?.obligation;
    const totalObligationPesewas = obligationObj?.amount ?? payment.amount;
    const paidAmountPesewas = obligationObj?.paidAmount ?? payment.amount;
    const outstandingAmountPesewas = obligationObj?.outstandingAmount ?? 0;
    const isFullySettled = outstandingAmountPesewas === 0;
    const formattedOutstanding = formatPesewas(outstandingAmountPesewas);

    // Build shareable link
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const shareableUrl = `${cleanBaseUrl}/receipts/${payment.id}`;

    // Build SMS and WhatsApp formatted message
    const formattedDate = formatDate(payment.paymentDate);
    const smsText = [
      "🧾 *OFFICIAL PAYMENT RECEIPT*",
      "--------------------------------",
      `*Group:* ${payment.group?.name || "Savings Group"}`,
      `*Receipt No:* ${receiptNumber}`,
      `*Date:* ${formattedDate}`,
      `*Member:* ${payment.member?.fullName || "Member"} (Seat #${payment.member?.rotationPosition ?? 1})`,
      "--------------------------------",
      `*Amount Paid:* ${formattedAmount}`,
      `*Words:* ${amountInWords}`,
      `*Payment Method:* ${channelName}`,
      payment.reference ? `*Ref / Txn ID:* ${payment.reference}` : null,
      `*Period:* ${periodLabel}`,
      `*Status:* ${payment.status === "VERIFIED" ? "✅ VERIFIED" : "⏳ PENDING VERIFICATION"}`,
      "--------------------------------",
      `*Remaining Period Balance:* ${formattedOutstanding} ${isFullySettled ? "(Fully Settled)" : ""}`,
      "--------------------------------",
      `View digital receipt: ${shareableUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const phoneForWhatsApp = cleanPhoneForWhatsApp(payment.member?.phoneNumber || "");
    const whatsAppUrl = `https://wa.me/${phoneForWhatsApp}?text=${encodeURIComponent(smsText)}`;

    return {
      receiptNumber,
      issuedAt,
      paymentId: payment.id,
      group: {
        id: payment.group?.id || "",
        name: payment.group?.name || "Rotating Savings Circle",
        currency: payment.group?.currency || "GHS",
      },
      member: {
        id: payment.member?.id || "",
        fullName: payment.member?.fullName || "",
        phoneNumber: payment.member?.phoneNumber || "",
        email: payment.member?.email || null,
        rotationPosition: payment.member?.rotationPosition || 1,
      },
      payment: {
        amountPesewas: payment.amount,
        formattedAmount,
        amountInWords,
        channel: channelName,
        rawChannel: payment.channel,
        reference: payment.reference,
        paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : issuedAt,
        status: payment.status,
        verifiedAt: payment.verifiedAt ? payment.verifiedAt.toISOString() : null,
        verifiedBy: payment.verifier?.fullName || null,
        notes: payment.notes || null,
      },
      period: {
        periodNumber,
        cycleNumber,
        dueDate,
        label: periodLabel,
      },
      obligation: {
        totalObligationPesewas,
        paidAmountPesewas,
        outstandingAmountPesewas,
        formattedOutstanding,
        isFullySettled,
      },
      dispatch: {
        whatsAppUrl,
        smsText,
        shareableUrl,
      },
    };
  }

  /**
   * Fetch payment and generate official receipt data from database.
   */
  static async getReceiptByPaymentId(paymentId: string, baseUrl?: string): Promise<ReceiptData> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        group: {
          select: { id: true, name: true, currency: true },
        },
        member: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            rotationPosition: true,
          },
        },
        period: {
          include: {
            cycle: {
              select: { cycleNumber: true },
            },
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
              include: {
                period: {
                  include: {
                    cycle: { select: { cycleNumber: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new ReceiptServiceError("Payment record not found.", 404);
    }

    return this.formatReceiptData(payment, baseUrl);
  }
}
