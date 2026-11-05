import { describe, it, expect } from "vitest";
import { generateReceiptPdf } from "@/lib/receipts/pdf-generator";
import { ReceiptData } from "@/services/receipt.service";

describe("generateReceiptPdf utility", () => {
  const sampleReceipt: ReceiptData = {
    receiptNumber: "RCP-04F981DC",
    issuedAt: "2026-03-01T10:00:00.000Z",
    paymentId: "04f981dc-4a6c-4871-92b1-5915d31ca23e",
    group: {
      id: "group-1",
      name: "Adom Savings Circle",
      currency: "GHS",
    },
    member: {
      id: "member-1",
      fullName: "Jeffery Mensah",
      phoneNumber: "+233240000004",
      email: "jeffery@rscms.com",
      rotationPosition: 4,
    },
    payment: {
      amountPesewas: 25000,
      formattedAmount: "GH₵250.00",
      amountInWords: "Two Hundred and Fifty Ghana Cedis Only",
      channel: "MTN Mobile Money",
      rawChannel: "MTN_MOMO",
      reference: "MOMO-2026-03-01-001",
      paymentDate: "2026-03-01T10:00:00.000Z",
      status: "VERIFIED",
      verifiedAt: "2026-03-01T10:05:00.000Z",
      verifiedBy: "System Admin",
      notes: null,
    },
    period: {
      periodNumber: 1,
      cycleNumber: 1,
      dueDate: "2026-03-31T23:59:59.000Z",
      label: "Cycle 1, Period 1",
    },
    obligation: {
      totalObligationPesewas: 25000,
      paidAmountPesewas: 25000,
      outstandingAmountPesewas: 0,
      formattedOutstanding: "GH₵0.00",
      isFullySettled: true,
    },
    dispatch: {
      whatsAppUrl: "https://wa.me/233240000004",
      smsText: "Receipt details...",
      shareableUrl: "https://rscms.vercel.app/receipts/04f981dc",
    },
  };

  it("generates a valid jsPDF document instance", () => {
    const doc = generateReceiptPdf(sampleReceipt);
    expect(doc).toBeDefined();
    const pdfOutput = doc.output("arraybuffer");
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });
});

