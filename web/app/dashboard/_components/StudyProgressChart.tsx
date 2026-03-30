"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

interface DayData {
  day: string;
  hours: number;
}

interface StudyProgressChartProps {
  data?: DayData[];
  title?: string;
  description?: string;
  className?: string;
}

const CHART_SURFACE = "#e6f4f1";
const CHART_ACCENT = "#006d77";

// Монгол хэл дээрх өгөгдөл
const defaultData: DayData[] = [
  { day: "Дав", hours: 3.5 },
  { day: "Мяг", hours: 2 },
  { day: "Лха", hours: 4.5 },
  { day: "Пүр", hours: 4 },
  { day: "Баа", hours: 2.5 },
  { day: "Бям", hours: 5 },
  { day: "Ням", hours: 4 },
];

// Цайвар стиль бүхий Tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-slate-200 rounded-lg bg-[#e6f4f1] px-3 py-2 text-xs shadow-lg shadow-black/5 backdrop-blur-md">
      <p className="text-slate-500 mb-0.5 font-medium">{label}</p>
      <p className="font-bold text-[#006d77]">{payload[0].value}ц</p>
    </div>
  );
}

export function StudyProgressChart({
  data = defaultData,
  title = "Суралцах явц",
  description = "Сүүлийн долоо хоногт хичээллэсэн цаг",
  className,
}: StudyProgressChartProps) {
  return (
    <Card
      className={cn(
        "flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border-white/40 bg-white/60 shadow-sm ring-1 ring-black/5 sm:min-h-[340px] lg:min-h-[360px]",
        className,
      )}
    >
      <CardHeader className="pb-1 pt-2 px-5">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <div className="rounded-lg bg-[#e6f4f1] p-1.5 text-[#006d77]">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-slate-400 text-[11px] font-medium pl-9">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="h-[220px] w-full sm:h-[235px] lg:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_ACCENT} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={CHART_SURFACE} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 8]}
                ticks={[0, 2, 4, 6, 8]}
                tickFormatter={(v) => `${v}ц`}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: CHART_ACCENT,
                  strokeWidth: 1.5,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke={CHART_ACCENT}
                strokeWidth={2.5}
                fill="url(#studyGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: CHART_SURFACE,
                  stroke: CHART_ACCENT,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
