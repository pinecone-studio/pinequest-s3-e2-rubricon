"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { graphqlRequest } from "@/lib/graphql";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { TrendingUp } from "lucide-react";

type SubmissionActivityResponse = {
  studentByEmail: {
    id: string;
  } | null;
  submissions: {
    id: string;
    student_id: string;
    submitted_at: string | null;
    status: "in_progress" | "submitted" | "reviewed" | null;
    answers: {
      id: string;
    }[];
  }[];
};

type DayData = {
  day: string;
  dateKey: string;
  fullDate: string;
  answers: number;
  submissions: number;
};

interface StudyProgressChartProps {
  title?: string;
  description?: string;
  className?: string;
}

const CHART_SURFACE = "#e6f4f1";
const CHART_ACCENT = "#006d77";

const SUBMISSION_ACTIVITY_QUERY = `
  query SubmissionActivity($email: String!) {
    studentByEmail(email: $email) {
      id
    }
    submissions {
      id
      student_id
      submitted_at
      status
      answers {
        id
      }
    }
  }
`;

const WEEKDAY_LABELS = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatFullDate = (date: Date) =>
  new Intl.DateTimeFormat("mn-MN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const createLast7DaysTemplate = (): DayData[] => {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      day: WEEKDAY_LABELS[date.getDay()],
      dateKey: getDateKey(date),
      fullDate: formatFullDate(date),
      answers: 0,
      submissions: 0,
    };
  });
};

const buildChartData = (
  submissions: SubmissionActivityResponse["submissions"],
  studentId: string,
) => {
  const baseWeek = createLast7DaysTemplate();
  const weekMap = new Map(baseWeek.map((item) => [item.dateKey, { ...item }]));

  submissions
    .filter(
      (submission) =>
        submission.student_id === studentId &&
        (submission.status === "submitted" ||
          submission.status === "reviewed") &&
        submission.submitted_at,
    )
    .forEach((submission) => {
      const submittedAt = new Date(submission.submitted_at as string);

      if (Number.isNaN(submittedAt.getTime())) {
        return;
      }

      const key = getDateKey(submittedAt);
      const existingDay = weekMap.get(key);

      if (!existingDay) {
        return;
      }

      existingDay.answers += submission.answers?.length ?? 0;
      existingDay.submissions += 1;
    });

  return baseWeek.map((day) => weekMap.get(day.dateKey) ?? day);
};

const buildYAxisTicks = (maxValue: number) => {
  const step = Math.max(1, Math.ceil(Math.max(maxValue, 4) / 4));
  return [0, step, step * 2, step * 3, step * 4];
};

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as DayData | undefined;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-[#e6f4f1] px-3 py-2 text-xs shadow-lg shadow-black/5 backdrop-blur-md">
      <p className="mb-0.5 font-medium text-slate-500">
        {point.day}, {point.fullDate}
      </p>

      <p className="font-bold text-[#006d77]">
        {point.submissions} шалгалт илгээсэн
      </p>
    </div>
  );
}

export function StudyProgressChart({
  title = "Суралцах явц",
  description = "Сүүлийн 7 хоногт илгээсэн хариултын идэвх",
  className,
}: StudyProgressChartProps) {
  const [data, setData] = useState<DayData[]>(createLast7DaysTemplate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) {
      return;
    }

    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const studentEmail = user?.primaryEmailAddress?.emailAddress;

        if (!studentEmail) {
          if (cancelled) return;

          setData(createLast7DaysTemplate());
          setMessage("График харахын тулд нэвтэрнэ үү.");
          setLoading(false);
          return;
        }

        const response = await graphqlRequest<SubmissionActivityResponse>(
          SUBMISSION_ACTIVITY_QUERY,
          { email: studentEmail },
        );

        if (cancelled) return;

        const studentId = response.studentByEmail?.id;

        if (!studentId) {
          setData(createLast7DaysTemplate());
          setMessage("Одоогоор таны оюутны мэдээлэл олдсонгүй.");
          return;
        }

        const nextData = buildChartData(response.submissions, studentId);
        const hasActivity = nextData.some((item) => item.answers > 0);

        setData(nextData);
        setMessage(
          hasActivity ? null : "Сүүлийн 7 хоногт илгээсэн хариулт алга байна.",
        );
      } catch (fetchError) {
        if (cancelled) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Суралцах явцын мэдээлэл дуудахад алдаа гарлаа.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress]);

  const maxAnswers = useMemo(
    () => Math.max(...data.map((item) => item.answers), 0),
    [data],
  );
  const yAxisTicks = useMemo(() => buildYAxisTicks(maxAnswers), [maxAnswers]);
  const totalAnswers = useMemo(
    () => data.reduce((sum, item) => sum + item.answers, 0),
    [data],
  );
  const activeDays = useMemo(
    () => data.filter((item) => item.answers > 0).length,
    [data],
  );

  return (
    <Card
      className={cn(
        "flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border-white/40 bg-white/60 shadow-sm ring-1 ring-black/5 sm:min-h-[340px] lg:min-h-[360px]",
        className,
      )}
    >
      <CardHeader className="px-5 pb-1 pt-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <div className="rounded-lg bg-[#e6f4f1] p-1.5 text-[#006d77]">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="pl-9 text-[11px] font-medium text-slate-400">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-2 pb-2">
        {loading ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-4 pt-2">
              <Skeleton className="h-3 w-28 bg-slate-200" />
              <Skeleton className="h-3 w-20 bg-slate-200" />
            </div>
            <div className="flex-1 px-3 pb-3 pt-4">
              <Skeleton className="h-full min-h-[220px] w-full rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-4 pb-1 pt-2 text-[11px] text-slate-500">
              <span>{activeDays} идэвхтэй өдөр</span>
            </div>

            <div className="h-[220px] w-full sm:h-[235px] lg:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="studyGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={CHART_ACCENT}
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_SURFACE}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="day"
                    dy={10}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    domain={[0, yAxisTicks[yAxisTicks.length - 1] ?? 4]}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(value) => `${value}`}
                    tickLine={false}
                    ticks={yAxisTicks}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: CHART_ACCENT,
                      strokeDasharray: "4 4",
                      strokeWidth: 1.5,
                    }}
                  />
                  <Area
                    activeDot={{
                      r: 4,
                      fill: CHART_SURFACE,
                      stroke: CHART_ACCENT,
                      strokeWidth: 2,
                    }}
                    dataKey="answers"
                    dot={false}
                    fill="url(#studyGradient)"
                    stroke={CHART_ACCENT}
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {message ? (
              <p className="px-4 pb-3 text-xs text-slate-500">{message}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
