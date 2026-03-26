"use client";

import { CircleCheckBig } from "lucide-react";

type AutomatedScoreProps = {
  score: number;
  total: number;
};

export const AutomatedScore = ({ score, total }: AutomatedScoreProps) => {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <CircleCheckBig
          size={16}
          strokeWidth={2.5}
          className="text-green-600"
        />
        <h4 className="text-sm font-semibold text-gray-800">Автомат Оноо</h4>
      </div>
      <div className="text-center py-2">
        <p className="text-4xl font-bold text-gray-900">
          {score}
          <span className="text-xl font-normal text-gray-400"> / {total}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Тестийн Асуултууд</p>
      </div>
    </div>
  );
};
