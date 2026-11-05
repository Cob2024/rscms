"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authFetch } from "@/lib/auth/auth-fetch";

const reports = [
  {
    type: "monthly",
    title: "Contribution history",
    description: "Expected obligations, verified payments and remaining balances by member and period.",
  },
  {
    type: "outstanding",
    title: "Outstanding balances",
    description: "Member obligations with an unpaid balance across recorded cycles.",
  },
  {
    type: "payouts",
    title: "Payout statement",
    description: "Expected, authorized and disbursed amounts, references and recipient acknowledgements.",
  },
];

export default function ReportsPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  async function download(type: string) {
    setLoading(type);
    setError("");
    try {
      const response = await authFetch(`/api/reports?type=${type}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Could not generate this report.");
        setLoading("");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? `${type}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error while generating report.");
    } finally {
      setLoading("");
    }
  }  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087F5B]">Financial Records</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102A43]">Reports</h1>
        <p className="mt-1 text-sm text-[#475569]">
          Exports are generated from verified payment allocations and recorded payout transactions.
        </p>
      </header>
      {error && (
        <div role="alert" className="rounded-md border border-[#FECACA] bg-[#FEECEB] p-3 text-sm font-semibold text-[#991B1B]">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.type} className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
            <CardHeader>
              <FileSpreadsheet className="mb-2 h-5 w-5 text-[#087F5B]" />
              <CardTitle className="text-base font-bold text-[#102A43]">{report.title}</CardTitle>
              <p className="text-sm text-[#64748B]">{report.description}</p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-[#CBD5E1] bg-white text-[#102A43] hover:bg-slate-50 shadow-xs"
                onClick={() => void download(report.type)}
                disabled={!!loading}
              >
                {loading === report.type ? (
                  <Download className="mr-2 h-4 w-4 animate-bounce text-[#087F5B]" />
                ) : (
                  <Download className="mr-2 h-4 w-4 text-[#087F5B]" />
                )}
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-[#64748B]">
        CSV exports are available in this release. Official receipt vector PDF and WhatsApp sharing are enabled under Payments.
      </p>
    </div>
  );
}
