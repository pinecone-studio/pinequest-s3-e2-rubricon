"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Student } from "../type";

export default function TrendChart({ students }: { students: Student[] }) {
  const data = students.map((s) => ({
    name: s.name.split(" ")[0],
    score: s.averageScore,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          📈 Чиг хандлага
        </h2>
        <p className="text-sm text-gray-500">
          Оюутнуудын гүйцэтгэлийн өөрчлөлт
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />

            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "none",
              }}
            />

            <Line
              type="monotone"
              dataKey="score"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}