import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle2, ShieldAlert, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — RSCMS",
  description:
    "Reasonable, transparent terms of service governing participation, double-entry record keeping, and rotational payouts under RSCMS.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#102A43] antialiased selection:bg-[#087F5B]/20 selection:text-[#087F5B]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#102A43] hover:text-[#087F5B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-[#102A43]">RSCMS</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6F4EF] text-[#066849] font-bold">
              TERMS
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-6 sm:p-10 md:p-12 space-y-10">
          {/* Header section */}
          <div className="border-b border-[#E2E8F0] pb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EF] text-[#066849]">
              <Scale className="w-4 h-4" />
              <span>TRANSPARENT ROTATING SAVINGS GOVERNANCE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm text-[#64748B]">
              Last updated: <strong>November 7, 2026</strong> • Clear, fair, and reasonable standards for all participants
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">01.</span>
              <span>Introduction &amp; Scope</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              These Terms and Conditions (&quot;Terms&quot;) govern the use of the <strong>Rotating Savings &amp; Collection Management System (&quot;RSCMS&quot;)</strong>.
              RSCMS is an institutional-grade financial ledger and administration application engineered to facilitate rotating peer-to-peer savings
              schemes (known traditionally in Ghana as <em>Susu</em> associations or credit circles).
            </p>
            <p className="text-sm text-[#334155] leading-relaxed">
              By participating in a savings group administered through RSCMS, both Group Administrators and Group Members agree to abide by these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">02.</span>
              <span>Nature of Software &amp; Fund Custody</span>
            </h2>
            <div className="p-4 rounded-2xl bg-[#FFF4E5] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5 leading-relaxed">
              <strong className="block text-sm font-bold text-[#92400E]">Important Custodial Clarification:</strong>
              RSCMS is a software technology platform and double-entry accounting ledger. <strong>RSCMS does not hold, lend, or invest member funds.</strong>{" "}
              All savings contributions remain strictly the property of group members, deposited into designated Mobile Money (MTN MoMo, Telecel Cash,
              AT Money) accounts or group bank clearing accounts managed directly by the appointed Group Administrator.
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">03.</span>
              <span>Member Commitments &amp; Contribution Invariant</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              To preserve group stability and trust, every participating member commits to:
            </p>
            <ul className="space-y-2 text-sm text-[#334155] list-disc list-inside">
              <li>
                <strong>Timely Contributions:</strong> Paying the agreed contribution amount (e.g. GH₵250.00 / 25,000 pesewas) on or before the
                calendar deadline for each designated period.
              </li>
              <li>
                <strong>Genuine Transaction Evidence:</strong> Providing valid Mobile Money transaction identifiers, bank payment advice, or receipt
                acknowledgments when reporting deposits.
              </li>
              <li>
                <strong>Reciprocal Honor:</strong> Fulfilling all remaining cycle contributions even after receiving their designated monthly payout.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">04.</span>
              <span>Rotational Payout Rules</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Payouts occur on a scheduled sequential rotation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Pre-Allocated Positions:</strong>
                Each member is assigned a clear rotation position (1 to N) determined by mutual group consensus upon cycle creation.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Solvency Prerequisite:</strong>
                A rotational payout is authorized and disbursed only after all required period contributions have been verified and reconciled in the clearing account.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Two-Step Authorization:</strong>
                Admins must formally authorize and execute disbursement, generating a dual-signature audit record.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Recipient Acknowledgment:</strong>
                Beneficiaries are invited to acknowledge receipt of their lump-sum payout via the system to conclude each period.
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">05.</span>
              <span>Official Digital Receipts &amp; Audit Records</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Every verified contribution produces a unique, downloadable, and printable <strong>Official Payment Receipt</strong>.
              The digital receipt includes transaction hash references, formal Ghanaian cedi words, timestamp, and administrator verification signatures.
              These receipts represent conclusive proof of member compliance within the group.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">06.</span>
              <span>Double-Entry Balance Guarantee</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              RSCMS enforces double-entry ledger invariants at the database level. Every debit must strictly equal its corresponding credit.
              Financial balances are stored as integer pesewas, mathematically preventing float-rounding discrepancies from arising.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">07.</span>
              <span>Dispute Resolution &amp; Governing Law</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              In the event of an internal disagreement regarding contributions or payout timing, parties agree to refer first to the immutable RSCMS
              audit log and official receipts. These Terms shall be construed and governed in accordance with the substantive laws of the
              <strong> Republic of Ghana</strong>.
            </p>
          </section>

          {/* Footer note */}
          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
            <span>© {new Date().getFullYear()} RSCMS Protocol • All rights reserved</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-[#087F5B] hover:underline font-semibold">
                Privacy Policy
              </Link>
              <Link href="/login" className="text-[#102A43] hover:underline font-semibold">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
