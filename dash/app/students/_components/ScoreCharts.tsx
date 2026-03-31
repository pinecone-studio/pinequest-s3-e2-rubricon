"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Student } from "../type";

export default function ScoreChart({ students }: { students: Student[] }) {
  const data = students.map((s) => ({
    name: s.name.split(" ")[0],
    score: s.averageScore,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          📊 Оюутны оноо
        </h2>
        <p className="text-sm text-gray-500">
          Оюутнуудын дундаж онооны харьцуулалт
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "none",
              }}
            />

            <Bar
            dataKey="score"
            radius={[6, 6, 0, 0]}
            fill="#3b82f6"
             />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}