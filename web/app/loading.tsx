import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="mx-14 mt-8 flex min-h-screen w-full items-center justify-center pb-10">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/40 bg-white/70 px-8 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <Spinner className="size-8 text-[#006d77]" />
        <p className="text-sm font-medium text-slate-500">Ачаалж байна...</p>
      </div>
    </div>
  );
}
