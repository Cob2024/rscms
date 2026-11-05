import { describe, it, expect } from "vitest";
import { ReceiptService } from "@/services/receipt.service";
import { PaymentChannel, PaymentStatus } from "@prisma/client";

describe("ReceiptService unit tests", () => {
  const mockPaymentRecord = {
    id: "04f981dc-4a6c-4871-92b1-5915d31ca23e",
    amount: 25000,
    channel: PaymentChannel.MTN_MOMO,
    reference: "MOMO-2026-03-01-001",
    paymentDate: new Date("2026-03-01T10:00:00.000Z"),
    status: PaymentStatus.VERIFIED,
    verifiedAt: new Date("2026-03-01T10:05:00.000Z"),
    notes: "Monthly contribution payment via MTN MoMo",
    group: {
      id: "group-123",
      name: "Adom Savings Circle",
      currency: "GHS",
    },
    member: {
      id: "member-456",
      fullName: "Jeffery Mensah",
      phoneNumber: "+233240000004",
      email: "jeffery@rscms.com",
      rotationPosition: 4,
    },
    period: {
      periodNumber: 1,
      dueDate: new Date("2026-03-31T23:59:59.000Z"),
      cycle: {
        cycleNumber: 1,
      },
    },
    verifier: {
      id: "admin-789",
      fullName: "System Admin",
      email: "admin@rscms.com",
    },
    allocations: [
      {
        amount: 25000,
        obligation: {
          amount: 25000,
          paidAmount: 25000,
          outstandingAmount: 0,
          period: {
            periodNumber: 1,
            cycle: {
              cycleNumber: 1,
            },
          },
        },
      },
    ],
  };

  it("formats standard receipt numbers and amounts in words", () => {
    const receipt = ReceiptService.formatReceiptData(mockPaymentRecord as any, "https://rscms.vercel.app");

    expect(receipt.receiptNumber).toBe("RCP-04F981DC");
    expect(receipt.payment.formattedAmount).toBe("GH₵250.00");
    expect(receipt.payment.amountInWords).toBe("Two Hundred and Fifty Ghana Cedis Only");
    expect(receipt.payment.channel).toBe("MTN Mobile Money");
    expect(receipt.obligation.isFullySettled).toBe(true);
    expect(receipt.obligation.formattedOutstanding).toBe("GH₵0.00");
  });

  it("generates correct WhatsApp and SMS message text", () => {
    const receipt = ReceiptService.formatReceiptData(mockPaymentRecord as any, "https://rscms.vercel.app");

    expect(receipt.dispatch.smsText).toContain("OFFICIAL PAYMENT RECEIPT");
    expect(receipt.dispatch.smsText).toContain("Adom Savings Circle");
    expect(receipt.dispatch.smsText).toContain("Jeffery Mensah");
    expect(receipt.dispatch.smsText).toContain("GH₵250.00");
    expect(receipt.dispatch.smsText).toContain("MOMO-2026-03-01-001");
    expect(receipt.dispatch.smsText).toContain("https://rscms.vercel.app/receipts/04f981dc-4a6c-4871-92b1-5915d31ca23e");

    // WhatsApp URL should be targeted to member's international phone number
    expect(receipt.dispatch.whatsAppUrl).toContain("wa.me/233240000004");
    expect(receipt.dispatch.whatsAppUrl).toContain(encodeURIComponent("OFFICIAL PAYMENT RECEIPT"));
  });

  it("handles partial settlement accurately", () => {
    const partialPayment = {
      ...mockPaymentRecord,
      amount: 10000,
      allocations: [
        {
          amount: 10000,
          obligation: {
            amount: 25000,
            paidAmount: 10000,
            outstandingAmount: 15000,
            period: {
              periodNumber: 1,
              cycle: { cycleNumber: 1 },
            },
          },
        },
      ],
    };

    const receipt = ReceiptService.formatReceiptData(partialPayment as any);
    expect(receipt.obligation.isFullySettled).toBe(false);
    expect(receipt.obligation.outstandingAmountPesewas).toBe(15000);
    expect(receipt.obligation.formattedOutstanding).toBe("GH₵150.00");
    expect(receipt.dispatch.smsText).toContain("*Remaining Period Balance:* GH₵150.00");
  });
});
