"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useStudents } from "./_hooks/useStudents";
import StudentTable from "./_components/StudentTable";
import AdvancedFilter from "./_components/AdvancedFilter";
import { Input } from "@/components/ui/input";

import { useStudentSearch } from "./_hooks/use-student-search";
import { Student } from "./type";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StudentTableSkeleton from "./_components/StudentTableSkeleton";

const normalizeStudents = (students: Student[]): Student[] => {
  const normalizeTrend = (trend: string): Student["trend"] => {
    if (trend === "up" || trend === "down" || trend === "stable") {
      return trend;
    }
    return "stable";
  };

  return students
    .map((s) => ({
      ...s,
      course: s.course ?? "-",
      className: s.className ?? "-",
      major: s.major ?? "-",
      trend: normalizeTrend(s.trend),
      lastActive: s.lastActive ?? "-",
      examHistory: s.examHistory ?? [],
    }))
    .sort((a, b) => {
      // ПРИОРИТЕТ 1: Дүн гарсан оюутнууд (finalScore !== null)
      const hasScoreA = a.finalScore !== null;
      const hasScoreB = b.finalScore !== null;

      if (hasScoreA && !hasScoreB) return -1;
      if (!hasScoreA && hasScoreB) return 1;

      // ПРИОРИТЕТ 2: Оноогоор нь буурахаар (хэрэв хоёулаа дүнтэй бол)
      if (hasScoreA && hasScoreB) {
        if (a.finalScore !== b.finalScore) {
          return (b.finalScore ?? 0) - (a.finalScore ?? 0);
        }
      }

      // ПРИОРИТЕТ 3: Шалгалт өгсөн тоогоор буурахаар
      if (a.examsTaken !== b.examsTaken) {
        return b.examsTaken - a.examsTaken;
      }

      // ПРИОРИТЕТ 4: Нэрээр нь ( fallback )
      return a.name.localeCompare(b.name);
    });
};

export default function Page() {
  const { students, loading, error } = useStudents();
  const normalizedStudents = normalizeStudents(students);
  const completeStudents = normalizedStudents; // Show all students

  const {
    searchQuery,
    setSearchQuery,
    courseFilter,
    setCourseFilter,
    classFilter,
    setClassFilter,
    majorFilter,
    setMajorFilter,
    scoreFilter,
    setScoreFilter,
    filteredItems,
  } = useStudentSearch(completeStudents);

  const [open, setOpen] = useState<boolean>(false);
  const activeFilterCount =
    courseFilter.length +
    classFilter.length +
    majorFilter.length +
    scoreFilter.length;

  const clearAll = () => {
    setCourseFilter([]);
    setClassFilter([]);
    setMajorFilter([]);
    setScoreFilter([]);
  };

  const hasAnyFilter =
    courseFilter.length > 0 ||
    classFilter.length > 0 ||
    majorFilter.length > 0 ||
    scoreFilter.length > 0;

  if (loading) {
    return <StudentTableSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-500">Алдаа: {error}</div>;
  }

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8 min-h-screen ">
        <div className="py-4 rounded-2xl  flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Input
              className="w-64 h-9"
              placeholder="Оюутан хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-[linear-gradient(to_bottom,rgba(36,72,95,0.9)_0%,rgba(41,97,129,0.86)_48%,rgba(49,168,224,0.82)_100%)] px-4 text-white transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Филтэр
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                Нарийвчилсан шүүлтүүр нээх
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {hasAnyFilter && (
          <div className="flex flex-wrap gap-2 items-center">
            <AnimatePresence initial={false}>
              {courseFilter.map((c) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  <span>{c}</span>
                  <button
                    className="text-slate-500 transition-all duration-200 ease-out hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    onClick={() =>
                      setCourseFilter((prev) => prev.filter((x) => x !== c))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}

              {classFilter.map((c) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  <span>{c}</span>
                  <button
                    className="text-slate-500 transition-all duration-200 ease-out hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    onClick={() =>
                      setClassFilter((prev) => prev.filter((x) => x !== c))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}

              {majorFilter.map((m) => (
                <motion.div
                  key={m}
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  <span>{m}</span>
                  <button
                    className="text-slate-500 transition-all duration-200 ease-out hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    onClick={() =>
                      setMajorFilter((prev) => prev.filter((x) => x !== m))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}

              {scoreFilter.map((s) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  <span>Оноо: {s}</span>
                  <button
                    className="text-slate-500 transition-all duration-200 ease-out hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    onClick={() =>
                      setScoreFilter((prev) => prev.filter((x) => x !== s))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition-all duration-200 ease-out hover:border-slate-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  <X className="h-3 w-3" />
                  Бүгдийг цэвэрлэх
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                Идэвхтэй бүх шүүлтийг цэвэрлэнэ
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {filteredItems.length > 0 ? (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <StudentTable students={filteredItems} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border bg-white p-5"
          >
            <motion.div
              className="mb-2 h-2 w-2 rounded-full bg-blue-500"
              animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <p className="text-sm font-semibold text-slate-900">
              Илэрц олдсонгүй
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Одоогоор идэвхтэй шүүлтүүрүүд:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {courseFilter.map((c) => (
                <span
                  key={`empty-course-${c}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  {c}
                </span>
              ))}
              {classFilter.map((c) => (
                <span
                  key={`empty-class-${c}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  {c}
                </span>
              ))}
              {majorFilter.map((m) => (
                <span
                  key={`empty-major-${m}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  {m}
                </span>
              ))}
              {scoreFilter.map((s) => (
                <span
                  key={`empty-score-${s}`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800"
                >
                  Оноо: {s}
                </span>
              ))}
              {!hasAnyFilter && (
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-800">
                  Шүүлтүүр идэвхгүй
                </span>
              )}
            </div>
            <button
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-all duration-200 ease-out hover:border-slate-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" />
              Нэг товшоод reset
            </button>
          </motion.div>
        )}

        <AdvancedFilter
          open={open}
          setOpen={setOpen}
          courseFilter={courseFilter}
          setCourseFilter={setCourseFilter}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          majorFilter={majorFilter}
          setMajorFilter={setMajorFilter}
          scoreFilter={scoreFilter}
          setScoreFilter={setScoreFilter}
        />
      </div>
    </TooltipProvider>
  );
}
