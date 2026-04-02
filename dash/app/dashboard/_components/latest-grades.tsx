"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { graphqlRequest } from "@/lib/graphql";

const SUBMISSIONS_QUERY = `#graphql
  query DashboardLatestSubmissions {
    submissions {
      id
      exam_id
      final_score
      started_at
      submitted_at
      status
    }
  }
`;

const EXAMS_QUERY = `#graphql
  query DashboardLatestGradesExams {
    exams {
      id
      title
      course {
        id
        code
        name
      }
    }
  }
`;

type GqlSubmission = {
  id: string;
  exam_id: string;
  final_score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  status: string | null;
};

type GqlExam = {
  id: string;
  title: string | null;
  course: {
    id: string;
    code: string | null;
    name: string | null;
  } | null;
};

type GradeRow = {
  id: string;
  icon: LucideIcon;
  title: string;
  course: string;
  score: string;
};

const ICONS: LucideIcon[] = [CheckCircle2, ClipboardList, Clock];

function getSortTimestamp(s: GqlSubmission): number {
  const iso = s.submitted_at ?? s.started_at;
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export function LatestGrades() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [submissionsData, examsData] = await Promise.all([
          graphqlRequest<{ submissions: GqlSubmission[] | null }>(
            SUBMISSIONS_QUERY,
          ),
          graphqlRequest<{ exams: GqlExam[] | null }>(EXAMS_QUERY),
        ]);

        const submissions = submissionsData.submissions ?? [];
        const exams = examsData.exams ?? [];

        const examById = new Map(exams.map((e) => [e.id, e]));

        const latestRows = submissions
          .filter((s) => s.final_score !== null && s.final_score !== undefined)
          .sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a))
          .slice(0, 3)
          .map((s, idx) => {
            const exam = examById.get(s.exam_id);
            const code = exam?.course?.code ?? "COURSE";
            const courseName = exam?.course?.name ?? "Нэргүй хичээл";

            return {
              id: s.id,
              icon: ICONS[idx % ICONS.length],
              title: exam?.title ?? "Шалгалтын нэргүй",
              course: `Хичээл: ${code} · ${courseName}`,
              score: `Оноо: ${s.final_score}`,
            };
          });

        if (!cancelled) setGrades(latestRows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Үнэлгээ ачаалсангүй");
          setGrades([]);
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
    if (grades.length === 0) return "Одоогоор үнэлгээ алга";
    return "Сүүлийн үнэлгээний мэдээлэл";
  }, [loading, error, grades.length]);

  return (
    <Card className="shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-[#e8eef4] w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[14px] font-bold text-[#2c3e50]">
              Сүүлийн үнэлгээ
            </CardTitle>
          </div>
          <Link href="/grading">
            <button className="text-[12px] text-[#31A8E0] font-semibold hover:underline">
              + Шинэ
            </button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-5 flex flex-col divide-y divide-[#e8eef4]">
        {loading ? (
          <div className="py-3 text-[12px] text-[#8a9bb0]">
            Ачааллаж байна...
          </div>
        ) : grades.length === 0 ? (
          <div className="py-3 text-[12px] text-[#8a9bb0]">
            Харах үнэлгээ одоогоор алга байна
          </div>
        ) : (
          grades.map((g) => (
            <div key={g.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2c3e50] mb-1">
                <g.icon className="w-3.5 h-3.5 text-[#31A8E0]" />
                {g.title}
              </div>
              <p className="text-[12px] text-[#8a9bb0]">{g.course}</p>
              <p className="text-[12px] font-semibold text-[#31A8E0] mt-0.5">
                {g.score}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
