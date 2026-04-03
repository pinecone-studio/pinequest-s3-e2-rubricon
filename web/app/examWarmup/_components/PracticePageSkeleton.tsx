import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PracticePageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3 pb-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
              {index === 1 ? <Skeleton className="h-2 w-full" /> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] xl:items-start">
        <div className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="py-2">
                <CardHeader>
                  <div className="mt-2 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="flex flex-col justify-between">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-full" />
              </div>

              <div className="rounded-lg bg-secondary/30 p-4">
                <Skeleton className="mb-3 h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-9 w-40 bg-[#006d77]/15" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-0">
          <div className="flex w-full items-center gap-4 py-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[1.5px] flex-1" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>

          <div className="mt-6 space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex w-full flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-3 w-24 bg-slate-200" />
                    <Skeleton className="h-4 w-48 bg-slate-200" />
                    <Skeleton className="h-3 w-32 bg-slate-200" />
                  </div>
                </div>

                <Skeleton className="h-9 w-24 rounded-full bg-slate-200 md:self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
