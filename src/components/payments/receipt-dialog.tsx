"use client";

import { useEffect, useState } from "react";
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ReceiptData } from "@/services/receipt.service";
import { formatDate } from "@/lib/formatting/date";
import { formatPesewas } from "@/lib/formatting/currency";
import { downloadReceiptPdf } from "@/lib/receipts/pdf-generator";
import { authFetch } from "@/lib/auth/auth-fetch";

interface ReceiptDialogProps {
  isOpen: boolean;
  paymentId: string | null;
  onClose: () => void;
}

export function ReceiptDialog({ isOpen, paymentId, onClose }: ReceiptDialogProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !paymentId) {
      setReceipt(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    authFetch(`/api/payments/${paymentId}/receipt`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load receipt details.");
        }
        if (isMounted) setReceipt(data.receipt);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Network error loading receipt.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    if (!receipt) return;
    setIsDownloading(true);
    try {
      downloadReceiptPdf(receipt);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleCopyText() {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.dispatch.smsText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // fallback
    }
  }

  async function handleCopyLink() {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.dispatch.shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  }

  function handleSendWhatsApp() {
    if (!receipt) return;
    window.open(receipt.dispatch.whatsAppUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Print-only CSS styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #rscms-printable-receipt,
          #rscms-printable-receipt * {
            visibility: visible !important;
          }
          #rscms-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative my-8 w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl print:border-none print:shadow-none print:p-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="print-hide absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Generating official payment receipt…
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h3 className="mt-3 text-base font-semibold text-destructive">
              Receipt Generation Error
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-5">
              Close
            </Button>
          </div>
        ) : receipt ? (
          <div>
            {/* Quick Action Dispatch Toolbar */}
            <div className="print-hide mb-6 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border bg-muted/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Send via WhatsApp
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyText}
                  className="text-xs"
                >
                  {copiedText ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Receipt Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy SMS Text
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Copy Web Link
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isDownloading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Download PDF
                </Button>

                <Button size="sm" variant="secondary" onClick={handlePrint}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print
                </Button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div
              id="rscms-printable-receipt"
              className="rounded-lg border bg-background p-6 sm:p-8 text-foreground"
            >
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-5 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                      RS
                    </span>
                    <h2 className="text-xl font-bold tracking-tight">
                      {receipt.group.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rotating Savings & Contribution Management System
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block rounded border border-emerald-600/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Official Receipt
                  </span>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {receipt.receiptNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date: {formatDate(receipt.payment.paymentDate)}
                  </p>
                </div>
              </div>

              {/* Member & Payment Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Received From (Member)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {receipt.member.fullName}
                  </p>
                  <p className="font-mono text-muted-foreground">
                    {receipt.member.phoneNumber}
                  </p>
                  <p className="text-muted-foreground">
                    Rotation Seat:{" "}
                    <span className="font-medium text-foreground">
                      Position {receipt.member.rotationPosition}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Payment Method & Reference
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {receipt.payment.channel}
                  </p>
                  {receipt.payment.reference && (
                    <p className="font-mono text-muted-foreground">
                      Txn Ref: {receipt.payment.reference}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    Period:{" "}
                    <span className="font-medium text-foreground">
                      {receipt.period.label}
                    </span>
                  </p>
                </div>
              </div>

              {/* Amount Highlight Card */}
              <div className="my-5 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Amount Received
                </p>
                <div className="my-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                  {receipt.payment.formattedAmount}
                </div>
                <p className="text-xs font-medium italic text-muted-foreground">
                  ({receipt.payment.amountInWords})
                </p>
              </div>

              {/* Obligation Breakdown Table */}
              <div className="border rounded-md overflow-hidden text-xs my-4">
                <div className="bg-muted px-4 py-2 font-semibold text-muted-foreground flex justify-between">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y">
                  <div className="px-4 py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        Monthly Contribution — {receipt.period.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Target obligation: {formatPesewas(receipt.obligation.totalObligationPesewas)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold">
                      {receipt.payment.formattedAmount}
                    </span>
                  </div>

                  <div className="px-4 py-2 flex justify-between items-center bg-muted/20">
                    <span className="font-medium">Remaining Period Obligation</span>
                    <span
                      className={`font-mono font-bold ${
                        receipt.obligation.isFullySettled
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {receipt.obligation.formattedOutstanding}{" "}
                      {receipt.obligation.isFullySettled && "(Cleared)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & System Stamp */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="font-semibold uppercase tracking-wide">
                    Verified & Recorded in General Ledger
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  Audit ID: {receipt.paymentId.slice(0, 16)}…
                </div>
              </div>

              {/* Footer text */}
              <p className="mt-4 text-center text-[10px] text-muted-foreground/70 border-t pt-3">
                This is an official computer-generated receipt issued by the RSCMS system for{" "}
                {receipt.group.name}.
              </p>
            </div>

            {/* Bottom Modal Actions */}
            <div className="print-hide mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isDownloading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Download PDF Receipt
              </Button>

              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
