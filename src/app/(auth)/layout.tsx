import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[#F5F7FA] p-4 sm:p-6">
      <div className="w-full flex justify-between items-center max-w-md pt-2">
        <Link
          href="/"
          className="text-xs font-semibold text-[#102A43] hover:text-[#087F5B] transition-colors"
        >
          ← Back to Landing Page
        </Link>
        <span className="text-[11px] font-mono text-[#64748B]">SECURE PORTAL</span>
      </div>

      <div className="w-full max-w-md my-auto">{children}</div>

      <footer className="w-full max-w-md py-4 text-center text-xs text-[#64748B] flex items-center justify-center gap-4">
        <Link href="/privacy" className="hover:text-[#102A43] hover:underline">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-[#102A43] hover:underline">
          Terms &amp; Conditions
        </Link>
      </footer>
    </div>
  );
}
