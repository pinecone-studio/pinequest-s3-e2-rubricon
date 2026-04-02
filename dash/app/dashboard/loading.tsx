"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex w-full flex-1 items-stretch gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="rounded-xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="w-[380px] shrink-0">
          <div className="rounded-xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-36" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-10" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full gap-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="w-full rounded-xl border border-[#e8eef4] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <Skeleton className="h-5 w-44" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <Skeleton key={rowIndex} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
