"use client";

import { CircleCheckBig } from "lucide-react";

type AutomatedScoreProps = {
  score: number;
  total: number;
};

export const AutomatedScore = ({ score, total }: AutomatedScoreProps) => {
  const safeTotal = Math.max(total, 0);
  const safeScore = Math.max(Math.min(score, safeTotal || score), 0);
  const percent =
    safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0;

  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <CircleCheckBig
          size={16}
          strokeWidth={2.5}
          className="text-[#1F9D8B]"
        />
        <h4 className="text-sm font-semibold text-gray-800">Автомат Оноо</h4>
      </div>
      <div className="text-center py-2 space-y-2">
        <p className="text-4xl font-bold text-gray-900">
          {safeScore}
          <span className="text-xl font-normal text-gray-400">
            {" "}
            / {safeTotal}
          </span>
        </p>
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-[#31A8E0] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs font-medium text-[#31A8E0]">{percent}%</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">Тестийн Асуултууд</p>
      </div>
    </div>
  );
};
