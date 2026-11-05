"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ReceiptData } from "@/services/receipt.service";
import { formatDate } from "@/lib/formatting/date";
import { formatPesewas } from "@/lib/formatting/currency";

export default function PublicReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/payments/${params.id}/receipt`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Official receipt could not be retrieved.");
        }
        if (isMounted) setReceipt(data.receipt);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load receipt.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    if (!receipt) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receipt.receiptNumber} - ${receipt.group.name}`,
          text: receipt.dispatch.smsText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Receipt link copied to clipboard!");
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 py-8 px-4 sm:px-6 lg:px-8">
      {/* Print-only CSS styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #public-printable-receipt,
          #public-printable-receipt * {
            visibility: visible !important;
          }
          #public-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
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

      <div className="mx-auto max-w-2xl">
        {/* Navigation & Action Bar */}
        <div className="print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return Home
            </Link>
          </Button>

          {receipt && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Share
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground">
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-24 text-center shadow-sm">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Verifying and retrieving official receipt…
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-bold text-destructive">
              Receipt Not Found
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline" size="sm" className="mt-6">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        ) : receipt ? (
          <div
            id="public-printable-receipt"
            className="rounded-xl border bg-card p-6 sm:p-10 shadow-lg text-foreground print:shadow-none print:border-none"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                    RS
                  </span>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">
                      {receipt.group.name}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Rotating Savings & Contribution Management System
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-block rounded border border-emerald-600/30 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Official Contribution Receipt
                </span>
                <p className="mt-1.5 font-mono text-sm font-bold text-foreground">
                  {receipt.receiptNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {formatDate(receipt.payment.paymentDate)}
                </p>
              </div>
            </div>

            {/* Member & Payment Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-6 border-b text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Received From (Member)
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {receipt.member.fullName}
                </p>
                <p className="font-mono text-muted-foreground">
                  {receipt.member.phoneNumber}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Rotation Seat:{" "}
                  <span className="font-semibold text-foreground">
                    Position {receipt.member.rotationPosition}
                  </span>
                </p>
              </div>

              <div className="sm:text-right">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Payment Method & Channel
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {receipt.payment.channel}
                </p>
                {receipt.payment.reference && (
                  <p className="font-mono text-muted-foreground">
                    Txn Ref: {receipt.payment.reference}
                  </p>
                )}
                <p className="mt-1 text-muted-foreground">
                  Period:{" "}
                  <span className="font-semibold text-foreground">
                    {receipt.period.label}
                  </span>
                </p>
              </div>
            </div>

            {/* Amount Banner */}
            <div className="my-6 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Amount Paid
              </p>
              <div className="my-1.5 text-4xl sm:text-5xl font-extrabold tracking-tight text-primary">
                {receipt.payment.formattedAmount}
              </div>
              <p className="text-xs font-medium italic text-muted-foreground">
                ({receipt.payment.amountInWords})
              </p>
            </div>

            {/* Obligation Statement Table */}
            <div className="border rounded-lg overflow-hidden text-xs my-5">
              <div className="bg-muted px-4 py-2.5 font-semibold text-muted-foreground flex justify-between">
                <span>Contribution Coverage</span>
                <span>Amount</span>
              </div>
              <div className="divide-y">
                <div className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">
                      Monthly Contribution — {receipt.period.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Total target obligation: {formatPesewas(receipt.obligation.totalObligationPesewas)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {receipt.payment.formattedAmount}
                  </span>
                </div>

                <div className="px-4 py-2.5 flex justify-between items-center bg-muted/20">
                  <span className="font-medium">Remaining Period Balance</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      receipt.obligation.isFullySettled
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {receipt.obligation.formattedOutstanding}{" "}
                    {receipt.obligation.isFullySettled && "(Fully Cleared)"}
                  </span>
                </div>
              </div>
            </div>

            {/* General Ledger Verification Seal */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-5 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold uppercase tracking-wide text-[11px]">
                    Verified & Recorded in General Ledger
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Status: {receipt.payment.status} · Issued by RSCMS Core Engine
                  </p>
                </div>
              </div>

              <div className="font-mono text-[10px] text-muted-foreground">
                Digital Fingerprint: {receipt.paymentId.slice(0, 18)}…
              </div>
            </div>

            {/* Official Footer */}
            <div className="mt-6 text-center text-[10px] text-muted-foreground/70 border-t pt-4">
              <p>
                This document serves as the official legal receipt for rotating savings contributions in {receipt.group.name}.
              </p>
              <p className="mt-0.5">
                Powered by RSCMS — Rotating Savings and Contribution Management System
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

