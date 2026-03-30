"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamCalendarProps {
  initialExamDates?: Date[];
  today?: Date;
  className?: string;
}

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
const MONTH_NAMES = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExamCalendar({
  initialExamDates = [new Date(2026, 3, 2)],
  today = new Date(2026, 2, 30),
  className,
}: ExamCalendarProps) {
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());
  const [examDates, setExamDates] = useState<Date[]>(initialExamDates);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingDeleteDate, setPendingDeleteDate] = useState<Date | null>(null);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const trailingDays = 42 - firstDayOfWeek - daysInMonth;

  const isToday = (d: number) => isSameDay(new Date(year, month, d), today);

  const isExam = (d: number) =>
    examDates.some((e) => isSameDay(e, new Date(year, month, d)));

  const isSelected = (d: number) =>
    selectedDate !== null && isSameDay(selectedDate, new Date(year, month, d));

  const handleDayClick = (d: number) => {
    const clicked = new Date(year, month, d);
    // toggle selection
    if (selectedDate && isSameDay(selectedDate, clicked)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(clicked);
    }
  };

  const removeExam = (date: Date) => {
    setExamDates(examDates.filter((e) => !isSameDay(e, date)));
    if (selectedDate && isSameDay(selectedDate, date)) setSelectedDate(null);
  };

  const focusExamDate = (date: Date) => {
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setSelectedDate(date);
  };

  const changeMonth = (dir: 1 | -1) => {
    let m = month + dir;
    let y = year;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  };

  const upcomingExams = [...examDates]
    .filter((e) => e >= today)
    .sort((a, b) => a.getTime() - b.getTime());
  const visibleUpcomingExams = upcomingExams.slice(0, 4);
  const hiddenUpcomingCount =
    upcomingExams.length - visibleUpcomingExams.length;

  return (
    <Card
      className={cn(
        "flex min-h-[320px] min-w-0 self-start flex-col overflow-hidden rounded-2xl border-white/40 bg-white/60 shadow-sm ring-1 ring-black/5 sm:min-h-[340px] lg:min-h-[360px]",
        className,
      )}
    >
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <div className="rounded-lg bg-[#e6f4f1] p-1.5 text-[#006d77]">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          Шалгалтын хуваарь
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 pb-3">
        <div>
          {/* Сар шилжих */}
          <div className="mb-3 mt-0 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:bg-[#e6f4f1]/70 hover:text-[#006d77]"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-slate-700 tracking-tight">
              {year} оны {MONTH_NAMES[month]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:bg-[#e6f4f1]/70 hover:text-[#006d77]"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Долоо хоногийн толгой */}
          <div className="mb-1.5 grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold uppercase tracking-tighter text-slate-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Өдрүүд */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div
                key={`prev-${i}`}
                className="flex h-[26px] items-center justify-center text-center text-[10px] text-slate-300"
              >
                {daysInPrevMonth - firstDayOfWeek + 1 + i}
              </div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const today_ = isToday(d);
              const exam_ = isExam(d);
              const sel_ = isSelected(d);

              return (
                <div
                  key={d}
                  onClick={() => handleDayClick(d)}
                  className={cn(
                    "mx-auto flex h-[26px] w-[26px] cursor-pointer select-none items-center justify-center rounded-full text-[10px] transition-all",
                    today_ &&
                      !sel_ &&
                      "bg-[#006d77] font-bold text-white shadow-md shadow-[#006d77]/20",
                    exam_ &&
                      !today_ &&
                      !sel_ &&
                      "bg-[#e6f4f1] font-bold text-[#006d77] ring-1 ring-[#006d77]/15",
                    sel_ &&
                      !today_ &&
                      "scale-110 bg-[#004f56] font-bold text-white ring-2 ring-[#c8e3dd]",
                    sel_ &&
                      today_ &&
                      "scale-110 bg-[#00565e] font-bold text-white ring-2 ring-[#b7d8d2]",
                    !today_ &&
                      !exam_ &&
                      !sel_ &&
                      "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {d}
                </div>
              );
            })}

            {Array.from({ length: trailingDays }, (_, i) => (
              <div
                key={`next-${i}`}
                className="flex h-[26px] items-center justify-center text-center text-[10px] text-slate-300"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {visibleUpcomingExams.length > 0 && (
            <div className="mt-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Удахгүй болох
              </p>
              {visibleUpcomingExams.map((e) => (
                <div
                  key={formatDate(e)}
                  onClick={() => focusExamDate(e)}
                  className="group flex cursor-pointer items-center justify-between rounded-lg bg-[#e6f4f1]/90 px-3 py-1.5 transition-colors hover:bg-[#d7ebe6]"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#006d77]" />
                    <span className="text-[11px] font-semibold text-[#006d77]">
                      {formatDate(e)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDeleteDate(e);
                    }}
                    aria-label={`${formatDate(e)} шалгалтыг хасах`}
                    className="rounded-full p-1 text-[#006d77]/70 transition-colors hover:bg-white/80 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {hiddenUpcomingCount > 0 && (
                <p className="pt-1 text-[10px] font-medium text-slate-400">
                  +{hiddenUpcomingCount} нэмэлт шалгалт байна
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex shrink-0 items-center gap-4 border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#006d77]" />
              <span className="text-[10px] font-medium text-slate-500">
                Өнөөдөр
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#e6f4f1] ring-1 ring-[#006d77]/20" />
              <span className="text-[10px] font-medium text-slate-500">
                Шалгалттай
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#004f56]" />
              <span className="text-[10px] font-medium text-slate-500">
                Сонгосон
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={pendingDeleteDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteDate(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Шалгалтыг хасах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteDate
                ? `${formatDate(pendingDeleteDate)} өдөрт тэмдэглэсэн шалгалтыг устгахдаа итгэлтэй байна уу?`
                : "Тэмдэглэсэн шалгалтыг устгахдаа итгэлтэй байна уу?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Үгүй</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteDate) {
                  removeExam(pendingDeleteDate);
                }
                setPendingDeleteDate(null);
              }}
            >
              Тийм
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
