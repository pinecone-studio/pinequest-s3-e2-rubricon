"use client";

import { EssayQuestion } from "@/lib/grading/types";
import { FeedbackSection } from "./FeedbackSection";
import { ManualRubric } from "./ManualRubric";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

type GradingSidebarProps = {
  mcScore: number;
  mcTotal: number;
  manualScore: number;
  manualTotal: number;
  currentEssay: EssayQuestion;
  onRubricChange: (criterionId: string, score: number) => void;
  onFeedbackChange: (val: string) => void;
  totalScore: number;
  maxTotalScore: number;
  finalPercent: number;
  onSubmit: () => void;
  onPrevStudent: () => void;
  onNextStudent: () => void;
};
export const GradingSidebar = ({
  mcScore,
  mcTotal,
  manualScore,
  manualTotal,
  currentEssay,
  onRubricChange,
  onFeedbackChange,
  totalScore,
  maxTotalScore,
  finalPercent,
  onSubmit,
  onPrevStudent,
  onNextStudent,
}: GradingSidebarProps) => {
  return (
    <aside className="w-80 border-l border-gray-200 bg-[#f0f4f8] flex flex-col overflow-y-auto">
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="border border-[#31A8E0]/25 rounded-2xl px-5 py-4 bg-[#31A8E0]/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Эцсийн Дүнгийн Урьдчилсан Харагдац
            </span>
            <span className="text-sm font-bold text-[#31A8E0]">
              {finalPercent}%
            </span>
          </div>
          <div className="text-xs leading-5 text-gray-600">
            <p>
              Автомат:{" "}
              <span className="font-semibold text-gray-800">
                {mcScore}/{mcTotal}
              </span>
            </p>
            <p>
              Багшийн оноо:{" "}
              <span className="font-semibold text-gray-800">
                {manualScore}/{manualTotal}
              </span>
            </p>
            <p>
              Нийт:{" "}
              <span className="font-semibold text-gray-800">
                {totalScore}/{maxTotalScore}
              </span>
            </p>
          </div>
        </div>

        <FeedbackSection
          feedback={currentEssay.feedback}
          onFeedbackChange={onFeedbackChange}
        />

        <ManualRubric
          rubric={currentEssay.rubric}
          onScoreChange={onRubricChange}
        />

        <div className="border border-gray-200 rounded-2xl px-5 py-4 bg-white flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Нийт Оноо</span>
          <span className="text-xl font-bold text-gray-900">
            {totalScore}
            <span className="text-sm font-normal text-gray-400">
              /{maxTotalScore}
            </span>
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 bg-white flex flex-col gap-5">
        <button
          onClick={onSubmit}
          className="w-full py-3 bg-[#31A8E0] hover:bg-[#2696CB] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition"
        >
          <Send size={16} />
          Оноо Оруулах
        </button>
        <div className="flex justify-between">
          <button
            onClick={onPrevStudent}
            className="text-sm text-gray-500 hover:text-gray-800 transition flex items-center gap-1 rounded-lg hover:bg-gray-100 py-1 px-0.5"
          >
            <ChevronLeft size={16} />
            Өмнөх Оюутан
          </button>
          <button
            onClick={onNextStudent}
            className="text-sm text-gray-500 hover:text-gray-800 transition flex items-center gap-1 rounded-lg hover:bg-gray-100 py-1 px-0.5"
          >
            Дараах Оюутан
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
