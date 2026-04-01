"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ExamHeader, ExamProgressBar, ExamQA } from "./_components";
import { ProctoringGuard } from "./_components/ProctoringGuard";
import { ExamProvider } from "./_hooks/use-exam-states";
import {
  EXAM_WARNING_CODES,
  ExamWarningTrackerProvider,
  useExamWarningTracker,
} from "./_hooks/use-exam-warning-tracker";
import { useExamData } from "./_hooks/use-exam-data";

const Exam = () => {
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  const { data, loading, error } = useExamData(examId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Шалгалтыг ачаалж байна...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!data || data.questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-gray-500">
        Энэ шалгалтад асуулт олдсонгүй.
      </div>
    );
  }

  return (
    <ExamProvider exam={data.exam} questions={data.questions}>
      <ExamWarningTrackerProvider>
        <ExamContent />
      </ExamWarningTrackerProvider>
    </ExamProvider>
  );
};

export default Exam;

export const ExamContent = () => {
  const { recordWarning, warningCount } = useExamWarningTracker();
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registerWarning = useCallback(
    (code: string, description: string) => {
      recordWarning(
        code as (typeof EXAM_WARNING_CODES)[keyof typeof EXAM_WARNING_CODES],
      );
      console.log(`[exam-warning] ${code}: ${description}`);
    },
    [recordWarning],
  );

  useEffect(() => {
    console.log(`[exam-warning-count] ${warningCount}`);
  }, [warningCount]);

  useEffect(() => {
    const handleWindowLeave = () => {
      if (document.hidden) return;
      registerWarning(EXAM_WARNING_CODES.windowLeave, "Цонхноос гарлаа!");
    };
    document.addEventListener("mouseleave", handleWindowLeave);
    return () => document.removeEventListener("mouseleave", handleWindowLeave);
  }, [registerWarning]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerWarning(EXAM_WARNING_CODES.tabHidden, "Tab сольж болохгүй!");
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) return;
      registerWarning(EXAM_WARNING_CODES.windowBlur, "Цонхноос гарлаа!");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [registerWarning]);

  const handleExamLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      console.log("[exam-warning] Шалгалтын хэсгээс гарах оролдлого илэрлээ");
    }, 100);
  };

  const handleExamEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden"
      id="exam-area"
    >
      <ProctoringGuard />
      <ExamHeader />
      <div
        className="flex flex-1 overflow-hidden"
        onMouseLeave={handleExamLeave}
        onMouseEnter={handleExamEnter}
      >
        <div className="flex-1 overflow-y-auto">
          <ExamQA />
        </div>
        <ExamProgressBar />
      </div>
    </div>
  );
};
