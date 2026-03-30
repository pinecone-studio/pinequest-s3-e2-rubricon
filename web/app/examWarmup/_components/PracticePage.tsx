"use client";

import { useEffect, useState } from "react";
import { graphqlRequest } from "@/lib/graphql";
import PracticeHeader from "./PracticeHeader";
import PracticeQuestion from "./PracticeQuestion";
import PracticeResults from "./PracticeResults";
import PracticeSetup from "./PracticeSetup";
import PracticePageSkeleton from "./PracticePageSkeleton";
import type {
  PracticeDifficulty,
  PracticeExamSummary,
  PracticeMode,
  PracticeQuestion as GeneratedPracticeQuestion,
  PracticeSession,
} from "./practiceTypes";

type WarmupExamsResponse = {
  exams: {
    id: string;
    title: string;
    start_time: string | null;
    course: {
      name: string | null;
      code: string | null;
    } | null;
  }[];
};

type GeneratePracticeResponse = {
  questions?: GeneratedPracticeQuestion[];
  error?: string;
};

const parseGeneratePracticeResponse = async (
  response: Response,
): Promise<GeneratePracticeResponse> => {
  const text = await response.text();

  try {
    return JSON.parse(text) as GeneratePracticeResponse;
  } catch {
    return {
      error: `Сервер JSON биш хариу өглөө (${response.status}). ${text
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200)}`,
    };
  }
};

const WARMUP_EXAMS_QUERY = `
  query WarmupExams {
    exams {
      id
      title
      start_time
      course {
        name
        code
      }
    }
  }
`;

export default function PracticePage() {
  const [exams, setExams] = useState<PracticeExamSummary[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<
    GeneratedPracticeQuestion[]
  >([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("exam");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("medium");

  useEffect(() => {
    let cancelled = false;

    const loadExams = async () => {
      try {
        setExamsLoading(true);
        setExamsError(null);

        const response =
          await graphqlRequest<WarmupExamsResponse>(WARMUP_EXAMS_QUERY);

        if (cancelled) {
          return;
        }

        const nextExams = [...(response.exams ?? [])]
          .sort((left, right) => {
            const leftTime = left.start_time
              ? new Date(left.start_time).getTime()
              : Number.MAX_SAFE_INTEGER;
            const rightTime = right.start_time
              ? new Date(right.start_time).getTime()
              : Number.MAX_SAFE_INTEGER;

            return leftTime - rightTime;
          })
          .map((exam) => ({
            id: exam.id,
            title: exam.title,
            courseName: exam.course?.name ?? "",
            courseCode: exam.course?.code ?? "",
            startTime: exam.start_time,
          }));

        setExams(nextExams);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setExamsError(
          error instanceof Error
            ? error.message
            : "Шалгалтуудыг дуудахад алдаа гарлаа.",
        );
      } finally {
        if (!cancelled) {
          setExamsLoading(false);
        }
      }
    };

    void loadExams();

    return () => {
      cancelled = true;
    };
  }, []);

  const startPractice = async () => {
    if (practiceMode === "exam" && !selectedExam) return;
    if (practiceMode === "topic" && !selectedTopic) return;

    try {
      setIsGenerating(true);
      setGenerationError(null);

      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          practiceMode === "exam"
            ? {
                examId: selectedExam,
                difficulty,
              }
            : {
                topic: selectedTopic,
                difficulty,
              },
        ),
      });

      const data = await parseGeneratePracticeResponse(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Асуулт үүсгэхэд алдаа гарлаа.");
      }

      if (!data.questions?.length) {
        throw new Error("Үүсгэсэн асуулт олдсонгүй.");
      }

      setPracticeQuestions(data.questions);
      setSession({
        examId: selectedExam || "",
        currentQuestion: 0,
        answers: new Array(data.questions.length).fill(null),
        showResults: false,
      });
      setSelectedAnswer(null);
      setShowExplanation(false);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Асуулт үүсгэхэд алдаа гарлаа.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = () => {
    if (!session || selectedAnswer === null) return;

    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestion] = parseInt(selectedAnswer, 10);
    setSession({ ...session, answers: newAnswers });
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (!session) return;

    if (session.currentQuestion < practiceQuestions.length - 1) {
      setSession({
        ...session,
        currentQuestion: session.currentQuestion + 1,
      });
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setSession({ ...session, showResults: true });
    }
  };

  const resetPractice = () => {
    setSession(null);
    setPracticeQuestions([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGenerationError(null);
  };

  const retryPractice = () => {
    if (!session) return;
    setSession({
      ...session,
      currentQuestion: 0,
      answers: new Array(practiceQuestions.length).fill(null),
      showResults: false,
    });
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const currentQuestion = session
    ? practiceQuestions[session.currentQuestion]
    : null;
  const correctAnswers = session
    ? session.answers.filter(
        (answer, index) => answer === practiceQuestions[index].correctAnswer,
      ).length
    : 0;

  return (
    <div className="space-y-6 ">
      <PracticeHeader />

      {!session && isGenerating ? (
        <PracticePageSkeleton />
      ) : !session ? (
        <>
          <PracticeSetup
            exams={exams}
            examsLoading={examsLoading}
            examsError={examsError}
            practiceMode={practiceMode}
            setPracticeMode={setPracticeMode}
            selectedExam={selectedExam}
            setSelectedExam={setSelectedExam}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            isGenerating={isGenerating}
            onStartPractice={startPractice}
          />
          {generationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {generationError}
            </div>
          ) : null}
        </>
      ) : !session.showResults ? (
        currentQuestion && (
          <PracticeQuestion
            session={session}
            currentQuestion={currentQuestion}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
            showExplanation={showExplanation}
            onSubmitAnswer={handleAnswer}
            onNextQuestion={nextQuestion}
            totalQuestions={practiceQuestions.length}
          />
        )
      ) : (
        <PracticeResults
          correctAnswers={correctAnswers}
          totalQuestions={practiceQuestions.length}
          onReset={resetPractice}
          onRetry={retryPractice}
        />
      )}
    </div>
  );
}
