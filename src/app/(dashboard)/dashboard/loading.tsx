import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-6 h-48 w-full" />
        </div>
        <div className="col-span-3 rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-6 h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
