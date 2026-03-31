"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { graphqlRequest } from "@/lib/graphql";

type RecentSubmittedExamsResponse = {
  studentByEmail: {
    id: string;
  } | null;
  submissions: {
    id: string;
    student_id: string;
    exam_id: string;
    submitted_at: string | null;
    status: "in_progress" | "submitted" | "reviewed" | null;
    answers: {
      id: string;
    }[];
  }[];
  exams: {
    id: string;
    title: string;
    course: {
      name: string;
      code: string;
    } | null;
  }[];
};

type RecentSubmissionCard = {
  id: string;
  title: string;
  subject: string;
  submittedAt: string;
  answeredCount: number;
  status: "submitted" | "reviewed";
};

const RECENT_SUBMISSIONS_LIMIT = 3;

const RECENT_SUBMITTED_EXAMS_QUERY = `
  query RecentSubmittedExams($email: String!) {
    studentByEmail(email: $email) {
      id
    }
    submissions {
      id
      student_id
      exam_id
      submitted_at
      status
      answers {
        id
      }
    }
    exams {
      id
      title
      course {
        name
        code
      }
    }
  }
`;

const formatSubmittedAt = (value: string) => {
  const submittedAt = new Date(value);

  if (Number.isNaN(submittedAt.getTime())) {
    return "Огноо тодорхойгүй";
  }

  const date = new Intl.DateTimeFormat("mn-MN", {
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

const getStatusLabel = (status: RecentSubmissionCard["status"]) =>
  status === "reviewed" ? "Шалгасан" : "Илгээсэн";

const buildRecentSubmissions = (
  data: RecentSubmittedExamsResponse,
  studentId: string,
) => {
  const examsById = new Map(data.exams.map((exam) => [exam.id, exam]));

  return data.submissions
    .filter(
      (submission) =>
        submission.student_id === studentId &&
        submission.submitted_at &&
        (submission.status === "submitted" || submission.status === "reviewed"),
    )
    .map<RecentSubmissionCard | null>((submission) => {
      const exam = examsById.get(submission.exam_id);

      if (!exam) {
        return null;
      }

      return {
        id: submission.id,
        title: exam.title,
        subject: exam.course?.name ?? exam.course?.code ?? "Хичээл тодорхойгүй",
        submittedAt: submission.submitted_at as string,
        answeredCount: submission.answers?.length ?? 0,
        status: submission.status as "submitted" | "reviewed",
      };
    })
    .filter((item): item is RecentSubmissionCard => item !== null)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() -
        new Date(left.submittedAt).getTime(),
    )
    .slice(0, RECENT_SUBMISSIONS_LIMIT);
};

export function RecentSubmittedExams() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<RecentSubmissionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) {
      return;
    }

    const loadRecentSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentEmail = user?.primaryEmailAddress?.emailAddress;

        if (!studentEmail) {
          if (cancelled) return;

          setItems([]);
          setMessage("Өгсөн шалгалтуудаа харахын тулд нэвтэрнэ үү.");
          setLoading(false);
          return;
        }

        const response = await graphqlRequest<RecentSubmittedExamsResponse>(
          RECENT_SUBMITTED_EXAMS_QUERY,
          { email: studentEmail },
        );

        if (cancelled) return;

        const studentId = response.studentByEmail?.id;

        if (!studentId) {
          setItems([]);
          setMessage("Таны оюутны мэдээлэл олдсонгүй.");
          return;
        }

        const nextItems = buildRecentSubmissions(response, studentId);
        setItems(nextItems);
        setMessage(
          nextItems.length === 0 ? "Одоогоор өгсөн шалгалт алга." : null,
        );
      } catch (fetchError) {
        if (cancelled) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Өгсөн шалгалтын мэдээлэл дуудахад алдаа гарлаа.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRecentSubmissions();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress]);

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Сүүлд өгсөн шалгалтууд
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Хамгийн сүүлд илгээсэн 3 шалгалтын товч мэдээлэл.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/exams#submitted-exams")}
          className="shrink-0"
        >
          Бүгдийг харах <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card
              key={`recent-submission-skeleton-${index + 1}`}
              className="overflow-hidden rounded-2xl border-white/40 bg-white/60 shadow-sm ring-1 ring-black/5"
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20 bg-slate-200" />
                    <Skeleton className="h-5 w-56 bg-slate-200" />
                  </div>
                </div>
                <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
          {message}
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden rounded-2xl border-white/40 bg-white/60 shadow-sm ring-1 ring-black/5"
            >
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f4f1] text-[#006d77]">
                    <FileCheck2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#006d77]">
                      {item.subject}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 md:text-base">
                      {item.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatSubmittedAt(item.submittedAt)}
                      </span>
                      <span>{item.answeredCount} хариулт илгээсэн</span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex self-start items-center rounded-full bg-[#e6f4f1] px-4 py-2 text-xs font-medium text-[#006d77] md:self-center">
                  {getStatusLabel(item.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
