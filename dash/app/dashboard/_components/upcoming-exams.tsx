"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { graphqlRequest } from "@/lib/graphql";

const EXAMS_QUERY = `#graphql
  query DashboardUpcomingExams {
    exams {
      id
      title
      start_time
      course_id
      course {
        id
        code
        name
      }
    }
  }
`;

const ENROLLMENTS_QUERY = `#graphql
  query DashboardUpcomingEnrollments {
    enrollments {
      id
      student_id
      course_id
    }
  }
`;

type GqlExam = {
  id: string;
  title: string | null;
  start_time: string;
  course_id: string | null;
  course: {
    id: string;
    code: string | null;
    name: string | null;
  } | null;
};

type GqlEnrollment = {
  id: string;
  student_id: string;
  course_id: string;
};

type UpcomingItem = {
  id: string;
  day: string;
  time: string;
  dayStyle: string;
  dotColor: string;
  name: string;
  meta: string;
};

const DAY_STYLES = [
  "text-[#31A8E0]",
  "text-[#1F9D8B]",
  "text-[#C27A17]",
] as const;
const DOT_COLORS = ["bg-[#31A8E0]", "bg-[#1F9D8B]", "bg-[#C27A17]"] as const;

const MN_WEEKDAY_SHORT = ["НЯ", "ДА", "МЯ", "ЛХ", "ПҮ", "БА", "БЯ"] as const;

function formatDayShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return MN_WEEKDAY_SHORT[d.getDay()];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function UpcomingExams() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [examData, enrollmentData] = await Promise.all([
          graphqlRequest<{ exams: GqlExam[] | null }>(EXAMS_QUERY),
          graphqlRequest<{ enrollments: GqlEnrollment[] | null }>(
            ENROLLMENTS_QUERY,
          ),
        ]);

        const exams = examData.exams ?? [];
        const enrollments = enrollmentData.enrollments ?? [];
        const now = Date.now();

        const studentsByCourse = new Map<string, Set<string>>();
        for (const enr of enrollments) {
          const set = studentsByCourse.get(enr.course_id) ?? new Set<string>();
          set.add(enr.student_id);
          studentsByCourse.set(enr.course_id, set);
        }

        const upcoming = exams
          .filter((e) => {
            const startMs = new Date(e.start_time).getTime();
            return !Number.isNaN(startMs) && startMs > now;
          })
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime(),
          )
          .slice(0, 3)
          .map((e, idx) => {
            const studentCount = e.course_id
              ? (studentsByCourse.get(e.course_id)?.size ?? 0)
              : 0;

            const courseCode = e.course?.code ?? "COURSE";
            const courseName = e.course?.name ?? "Нэргүй хичээл";

            return {
              id: e.id,
              day: formatDayShort(e.start_time),
              time: formatTime(e.start_time),
              dayStyle: DAY_STYLES[idx % DAY_STYLES.length],
              dotColor: DOT_COLORS[idx % DOT_COLORS.length],
              name: e.title ?? "Нэргүй шалгалт",
              meta: `${courseCode} · ${courseName} · ${studentCount} оюутан`,
            };
          });

        if (!cancelled) setItems(upcoming);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Шалгалтын мэдээлэл ачаалсангүй",
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = useMemo(() => {
    if (loading) return "Ачааллаж байна...";
    if (error) return "Мэдээлэл ачаалж чадсангүй";
    if (items.length === 0) return "Төлөвлөгдсөн шалгалт алга";
    return "Хуваарийн дагуу";
  }, [loading, error, items.length]);

  return (
    <Card className="shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-[#e8eef4] h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-[14px] font-bold text-[#2c3e50]">
          Удахгүй болох шалгалт
        </CardTitle>
        <p className="text-[11.5px] text-[#8a9bb0] mt-0.5">{subtitle}</p>
      </CardHeader>

      <CardContent className="px-5 flex flex-1 flex-col divide-y divide-[#e8eef4]">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-[44px] shrink-0 space-y-1">
                <Skeleton className="h-3 w-7" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-2.5 text-[12px] text-[#8a9bb0]">
            Удахгүй эхлэх шалгалт олдсонгүй
          </div>
        ) : (
          items.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div
                className={cn("text-start min-w-[44px] shrink-0", u.dayStyle)}
              >
                <p className="text-[10px] font-bold uppercase">{u.day}</p>
                <p className="text-[13px] font-bold">{u.time}</p>
              </div>
              <div
                className={cn("w-2 h-2 rounded-full shrink-0", u.dotColor)}
              />
              <div>
                <p className="text-[13px] font-semibold text-[#2c3e50]">
                  {u.name}
                </p>
                <p className="text-[11px] text-[#8a9bb0] mt-0.5">{u.meta}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
