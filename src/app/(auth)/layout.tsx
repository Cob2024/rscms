export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-4">
      {children}
    </div>
  );
}
