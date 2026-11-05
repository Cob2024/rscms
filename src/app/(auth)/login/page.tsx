import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#087F5B] text-white shadow-xs">
          <span className="text-2xl font-bold">R</span>
        </div>
        <CardTitle className="text-2xl font-bold text-[#102A43]">RSCMS</CardTitle>
        <CardDescription className="text-[#475569]">Rotating Savings & Contribution Management</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
