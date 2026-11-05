import { jsPDF } from "jspdf";
import { type ReceiptData } from "@/services/receipt.service";
import { formatDate } from "@/lib/formatting/date";
import { formatPesewas } from "@/lib/formatting/currency";

/**
 * Client-side vector PDF generator for RSCMS official payment receipts.
 * Generates and triggers instant download of a high-resolution, professional PDF receipt.
 */
export function generateReceiptPdf(receipt: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 16;

  // 1. Top Decorative Header Bar (Emerald)
  doc.setFillColor(5, 150, 105); // #059669
  doc.rect(0, 0, pageWidth, 5, "F");

  // 2. Organization Brand & Title
  // Left: Logo badge
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(margin, currentY, 12, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RS", margin + 3.2, currentY + 7.8);

  // Left: Group Title
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(receipt.group.name, margin + 16, currentY + 5.5);

  doc.setTextColor(100, 116, 139); // #64748b
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Rotating Savings & Contribution Management System", margin + 16, currentY + 10.5);

  // Right: Official Receipt Badge & Number
  const rightX = pageWidth - margin;
  doc.setFillColor(236, 253, 245); // #ecfdf5
  doc.setDrawColor(167, 243, 208); // #a7f3d0
  doc.roundedRect(rightX - 44, currentY, 44, 7, 1.5, 1.5, "FD");

  doc.setTextColor(6, 95, 70); // #065f46
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("OFFICIAL RECEIPT", rightX - 22, currentY + 4.8, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(receipt.receiptNumber, rightX, currentY + 12, { align: "right" });

  currentY += 18;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, rightX, currentY);

  currentY += 7;

  // 3. Member & Transaction Details (2 Columns)
  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 5;

  // Column 1: Member
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("RECEIVED FROM (MEMBER)", col1X, currentY);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(receipt.member.fullName, col1X, currentY + 5.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Phone: ${receipt.member.phoneNumber}`, col1X, currentY + 10);
  doc.text(`Rotation Seat: Position ${receipt.member.rotationPosition}`, col1X, currentY + 14.5);

  // Column 2: Payment Details
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("TRANSACTION PARTICULARS", col2X, currentY);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(receipt.payment.channel, col2X, currentY + 5.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: ${formatDate(receipt.payment.paymentDate)}`, col2X, currentY + 10);
  if (receipt.payment.reference) {
    doc.text(`Txn Ref: ${receipt.payment.reference}`, col2X, currentY + 14.5);
  }
  doc.text(`Period: ${receipt.period.label}`, col2X, currentY + 19);

  currentY += 26;

  // 4. Prominent Amount Highlight Card
  const bannerHeight = 26;
  doc.setFillColor(240, 253, 244); // #f0fdf4
  doc.setDrawColor(187, 247, 208); // #bbf7d0
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 3, 3, "FD");

  doc.setTextColor(22, 101, 52); // #166534
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL AMOUNT RECEIVED", pageWidth / 2, currentY + 6.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(receipt.payment.formattedAmount, pageWidth / 2, currentY + 16, { align: "center" });

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text(`(${receipt.payment.amountInWords})`, pageWidth / 2, currentY + 21.5, { align: "center" });

  currentY += bannerHeight + 9;

  // 5. Obligation Statement Table
  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.rect(margin, currentY, contentWidth, 7, "F");

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CONTRIBUTION DESCRIPTION", margin + 3, currentY + 4.8);
  doc.text("PERIOD", margin + 95, currentY + 4.8);
  doc.text("AMOUNT PAID", rightX - 3, currentY + 4.8, { align: "right" });

  currentY += 7;

  // Table Row 1: Contribution
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, 10, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY + 10, rightX, currentY + 10);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Monthly Contribution Payment", margin + 3, currentY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Target: ${formatPesewas(receipt.obligation.totalObligationPesewas)}`, margin + 3, currentY + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(receipt.period.label, margin + 95, currentY + 6);

  doc.setFont("helvetica", "bold");
  doc.text(receipt.payment.formattedAmount, rightX - 3, currentY + 6, { align: "right" });

  currentY += 10;

  // Table Row 2: Remaining Balance
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 8, "F");
  doc.line(margin, currentY + 8, rightX, currentY + 8);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Remaining Period Obligation Balance", margin + 3, currentY + 5.2);

  const statusText = receipt.obligation.isFullySettled
    ? `${receipt.obligation.formattedOutstanding} (Fully Settled)`
    : receipt.obligation.formattedOutstanding;

  doc.setTextColor(receipt.obligation.isFullySettled ? 5 : 180, receipt.obligation.isFullySettled ? 150 : 83, receipt.obligation.isFullySettled ? 105 : 9);
  doc.text(statusText, rightX - 3, currentY + 5.2, { align: "right" });

  currentY += 14;

  // 6. General Ledger & Verification Seal
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, "FD");

  doc.setTextColor(6, 95, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("VERIFIED & RECORDED IN GENERAL LEDGER", margin + 4, currentY + 5.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Status: ${receipt.payment.status}  |  General Ledger Double-Entry Ref: TXN-PAY-${receipt.paymentId.slice(0, 8).toUpperCase()}`,
    margin + 4,
    currentY + 10
  );

  currentY += 20;

  // 7. Legal Disclaimer Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, rightX, currentY);

  currentY += 5;
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `This is an official computer-generated receipt issued by RSCMS on behalf of ${receipt.group.name}.`,
    pageWidth / 2,
    currentY,
    { align: "center" }
  );
  doc.text(
    `Digital Verification URL: ${receipt.dispatch.shareableUrl}`,
    pageWidth / 2,
    currentY + 3.8,
    { align: "center" }
  );

  return doc;
}

/**
 * Triggers instant browser download of the receipt as a PDF.
 */
export function downloadReceiptPdf(receipt: ReceiptData): void {
  const doc = generateReceiptPdf(receipt);
  const safeMemberName = receipt.member.fullName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Receipt-${receipt.receiptNumber}-${safeMemberName}.pdf`;
  doc.save(filename);
}

