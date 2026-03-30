"use client";

import { useState } from "react";
import { BookOpen, CalendarDays, ChevronDown, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CompletedExamCard = {
  id: string;
  subject?: string;
  title: string;
  submittedAt: string;
  answeredCount: number;
  totalQuestions: number;
};

const MOCK_COMPLETED_EXAMS: CompletedExamCard[] = [
  {
    id: "mock-completed-1",
    subject: "Програмчлалын үндэс",
    title: "mock-completed-1",
    submittedAt: "2026-03-20T10:15:00.000Z",
    answeredCount: 18,
    totalQuestions: 20,
  },
  {
    id: "mock-completed-2",
    subject: "Математик",
    title: "mock-completed-2",
    submittedAt: "2026-03-23T07:40:00.000Z",
    answeredCount: 12,
    totalQuestions: 15,
  },
  {
    id: "mock-completed-3",
    subject: "Англи хэл",
    title: "mock-completed-3",
    submittedAt: "2026-03-27T05:30:00.000Z",
    answeredCount: 25,
    totalQuestions: 25,
  },
];

const formatSubmittedAt = (value: string) => {
  const submittedAt = new Date(value);

  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(submittedAt);

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(submittedAt);

  return `${date} · ${time}`;
};

const CompletedExams = () => {
  const [isOpen, setIsOpen] = useState(false);
  const completedExams = MOCK_COMPLETED_EXAMS;

  return (
    <section className="mt-14">
      <button
        type="button"
        onClick={() => setIsOpen((prev: boolean) => !prev)}
        aria-expanded={isOpen}
        className="group flex w-full items-center gap-4 py-4 text-left hover:cursor-pointer transition-all"
      >
        <h2 className="font-bold text-[16px] text-slate-800 whitespace-nowrap transition-colors">
          Өгсөн шалгалтууд
        </h2>

        <div className="h-[1.5px] flex-1 bg-slate-200 rounded-full overflow-hidden relative">
          <div
            className={`absolute inset-0 transition-transform duration-500 origin-left ${
              isOpen ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </div>

        <div
          className={cn(
            "p-1.5 rounded-full transition-all duration-200",
            isOpen
              ? "bg-slate-50 text-slate-400"
              : "bg-slate-50 text-slate-400 group-hover:bg-slate-100",
          )}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen
            ? "mt-6 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pt-1">
            {completedExams.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
                Одоогоор өгсөн шалгалт алга.
              </div>
            ) : (
              completedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#006d77]">
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      {exam.subject ? (
                        <p className="text-[11px] font-medium text-[#006d77]">
                          {exam.subject}
                        </p>
                      ) : null}

                      <h3 className="text-[13px] font-semibold text-gray-800 md:text-[16px]">
                        {exam.title}
                      </h3>

                      <div className="flex items-center gap-3 text-gray-500 text-xs pt-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatSubmittedAt(exam.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#e6f4f1] text-[#006d77] px-4 py-2 text-xs font-medium  md:self-center">
                    <FileCheck2 className="h-4 w-4" />
                    <span>
                      {exam.answeredCount}/{exam.totalQuestions} асуулт
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompletedExams;
