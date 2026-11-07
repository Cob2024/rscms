import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — RSCMS",
  description:
    "Plain-language, reasonable privacy policy explaining how RSCMS processes member data and financial records under the Ghana Data Protection Act (Act 843).",
};

export default function PrivacyPolicyPage() {
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
              PRIVACY
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
              <ShieldCheck className="w-4 h-4" />
              <span>GHANA DATA PROTECTION COMPLIANT (ACT 843)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-[#64748B]">
              Last updated: <strong>November 7, 2026</strong> • Effective for all rotating savings groups and members
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">01.</span>
              <span>Overview &amp; Purpose</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              This Privacy Policy explains how the <strong>Rotating Savings &amp; Collection Management System (&quot;RSCMS&quot;)</strong> collects,
              safeguards, and processes data. RSCMS provides ledger accounting and cycle coordination software for peer-to-peer rotating savings
              groups (commonly known as <em>Susu</em> groups) in Ghana.
            </p>
            <p className="text-sm text-[#334155] leading-relaxed">
              Our privacy commitment is strictly reasonable: <strong>we collect only what is mathematically and legally necessary</strong> to maintain
              an honest, balanced ledger, issue verifiable receipts, and ensure transparent rotational payouts. We do not sell, rent, or monetize
              your personal data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">02.</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Depending on whether you are a Group Administrator or a Group Member, we collect:
            </p>
            <ul className="space-y-2 text-sm text-[#334155] list-disc list-inside">
              <li>
                <strong>Member Identity Details:</strong> Full legal or group display name, active Ghanaian phone number (used for Mobile Money
                reconciliation), optional email address, and assigned rotation position.
              </li>
              <li>
                <strong>Financial Contribution Records:</strong> Contribution amount (recorded in integer pesewas), payment channel (MTN Mobile Money,
                Telecel Cash, AT Money, Bank Transfer, or Cash), transaction reference ID, payment timestamp, and payment status.
              </li>
              <li>
                <strong>Audit &amp; System Metadata:</strong> Administrative adjustment reasons, deadline changes, payment reversal logs, and login
                timestamps to ensure group governance and prevent unauthorized alterations.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">03.</span>
              <span>How Information is Used</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Your information is processed strictly for the following operational objectives:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Double-Entry Reconciliation:</strong>
                Balancing cash collections against outstanding member obligations and group payout reserves.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Receipt Generation:</strong>
                Creating tamper-evident printable PDF and web receipts accessible to members upon payment.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Payout Distribution:</strong>
                Ensuring rotational funds are disbursed exclusively to the designated and verified beneficiary.
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                <strong className="block text-[#102A43] mb-1">Dispute Resolution:</strong>
                Maintaining an unalterable audit log for mutual transparency among all group participants.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">04.</span>
              <span>Data Protection &amp; Security Controls</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              We apply defense-in-depth security principles to safeguard your information:
            </p>
            <ul className="space-y-2 text-sm text-[#334155] list-disc list-inside">
              <li>
                <strong>Row Level Security &amp; Isolation:</strong> Access controls are enforced server-side. Unauthenticated users cannot view member
                rosters or ledger accounts.
              </li>
              <li>
                <strong>Cryptographic Authentication:</strong> Administrative passwords and session tokens are encrypted using industry-standard hashing
                and secure, HttpOnly cookie flags.
              </li>
              <li>
                <strong>Strict Currency Integrity:</strong> Financial numbers are maintained in integer pesewas to eliminate floating-point calculation
                discrepancies.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">05.</span>
              <span>Your Rights Under Ghanaian Law</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              In accordance with the <strong>Data Protection Act, 2012 (Act 843) of the Republic of Ghana</strong>, members have the right to:
            </p>
            <ul className="space-y-1.5 text-sm text-[#334155] list-disc list-inside">
              <li>Inspect and receive copies of their contribution history and official receipts.</li>
              <li>Request correction of inaccurate contact or payment information via their Group Administrator.</li>
              <li>Request deletion of non-accounting contact records upon completion of their savings cycle obligations.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-sm font-mono text-[#087F5B]">06.</span>
              <span>Contact &amp; Administrative Queries</span>
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              If you have any questions about this Privacy Policy, your contribution records, or data handling practices within your group, please
              contact your savings group administrator or reach out to our system governance team.
            </p>
          </section>

          {/* Footer note */}
          <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
            <span>© {new Date().getFullYear()} RSCMS Protocol • All rights reserved</span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-[#087F5B] hover:underline font-semibold">
                Terms and Conditions
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
