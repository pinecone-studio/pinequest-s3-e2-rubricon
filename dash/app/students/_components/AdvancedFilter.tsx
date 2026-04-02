"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdvancedFilterProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  courseFilter: string[];
  setCourseFilter: React.Dispatch<React.SetStateAction<string[]>>;
  classFilter: string[];
  setClassFilter: React.Dispatch<React.SetStateAction<string[]>>;
  majorFilter: string[];
  setMajorFilter: React.Dispatch<React.SetStateAction<string[]>>;
  scoreFilter: string[];
  setScoreFilter: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AdvancedFilter({
  open,
  setOpen,
  courseFilter,
  setCourseFilter,
  classFilter,
  setClassFilter,
  majorFilter,
  setMajorFilter,
  scoreFilter,
  setScoreFilter,
}: AdvancedFilterProps) {
  const strictCourses = ["1-р курс", "2-р курс", "3-р курс", "4-р курс"];
  const strictClasses = ["CS101", "CS201", "CS301", "CS401"];
  const strictMajors = [
    "Computer Science",
    "Algorithms",
    "Software",
    "Cybersecurity",
  ];
  const scoreRanges = ["0-60", "61-80", "81-100"];

  const selectedCount = useMemo(
    () =>
      courseFilter.length +
      classFilter.length +
      majorFilter.length +
      scoreFilter.length,
    [
      courseFilter.length,
      classFilter.length,
      majorFilter.length,
      scoreFilter.length,
    ]
  );

  const toggleItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <DialogContent className="max-w-3xl overflow-hidden p-0 shadow-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
          <div className="border-b border-white/10 bg-[linear-gradient(to_bottom,rgba(36,72,95,0.9)_0%,rgba(41,97,129,0.86)_48%,rgba(49,168,224,0.82)_100%)] px-6 py-5 text-white">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="h-5 w-5" />
            Нарийвчилсан шүүлтүүр
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-100">
            Курс, анги, мэргэжлээр шүүнэ. {selectedCount} сонголт идэвхтэй.
          </p>
        </div>

        <div className="p-6 space-y-6 bg-slate-50">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Курс</p>
            <div className="flex flex-wrap gap-2">
              {strictCourses.map((c) => {
                const active = courseFilter.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleItem(c, setCourseFilter)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Анги</p>
            <div className="flex flex-wrap gap-2">
              {strictClasses.map((c) => {
                const active = classFilter.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleItem(c, setClassFilter)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      active
                        ? "border-violet-600 bg-blue-600 text-white"
                        : "bg-white text-slate-700 border-slate-300 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Мэргэжил</p>
            <div className="flex flex-wrap gap-2">
              {strictMajors.map((m) => {
                const active = majorFilter.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleItem(m, setMajorFilter)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      active
                        ? "border-emerald-600 bg-blue-600 text-white"
                        : "bg-white text-slate-700 border-slate-300 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Онооны интервал</p>
            <div className="flex flex-wrap gap-2">
              {scoreRanges.map((range) => {
                const active = scoreFilter.includes(range);
                return (
                  <button
                    key={range}
                    onClick={() => toggleItem(range, setScoreFilter)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      active
                        ? "border-cyan-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t bg-white px-6 py-4 flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setCourseFilter([]);
                  setClassFilter([]);
                  setMajorFilter([]);
                  setScoreFilter([]);
                }}
                className="gap-2 transition-all duration-200 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" />
                Дахин тохируулах
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Бүх шүүлтүүрийг цэвэрлэнэ</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="transition-all duration-200 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Болих
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Өөрчлөлтийг хадгалахгүй</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setOpen(false)}
                  className="gap-2 bg-blue-600 text-white transition-all duration-200 ease-out hover:bg-blue-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Шүүлт
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Сонгосон шүүлтүүдийг хэрэгжүүлнэ</TooltipContent>
            </Tooltip>
          </div>
        </div>
        </DialogContent>
      </TooltipProvider>
    </Dialog>
  );
}
