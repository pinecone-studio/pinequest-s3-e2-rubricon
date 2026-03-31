"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { graphqlRequest } from "@/lib/graphql";
import {
  ArrowLeft,
  Check,
  Clock,
  Calendar,
  BookOpen,
  Loader2,
  Pencil,
  Trash2,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { AddQuestionManually } from "./_components/AddQuestionManually";
import { QuestionCreator } from "./_components/QuestionCreator";
import type { ExamDifficulty, ExamQuestionDraft } from "../_components/exam-draft-types";

const EXAM_QUERY = `#graphql
  query ExamDetail($id: String!) {
    exam(id: $id) {
      id
      title
      description
      start_time
      end_time
      duration
      course {
        name
        code
      }
      questions {
        id
        text
        image_url
        order_index
        difficulty
        answers {
          id
          text
          is_correct
        }
      }
    }
  }
`;

const DELETE_QUESTION = `#graphql
  mutation DeleteQuestion($id: String!) {
    deleteQuestion(id: $id)
  }
`;

const DELETE_EXAM = `#graphql
  mutation DeleteExam($id: String!) {
    deleteExam(id: $id)
  }
`;

type AnswerRow = {
  id: string;
  text: string;
  is_correct: boolean;
};

type QuestionRow = {
  id: string;
  text: string;
  image_url?: string | null;
  order_index: number | null;
  difficulty: string | null;
  answers: AnswerRow[] | null;
};

type ExamDetail = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  course: { name: string; code: string } | null;
  questions: QuestionRow[] | null;
};

function answersToDraft(q: QuestionRow): ExamQuestionDraft {
  const sorted = [...(q.answers ?? [])].sort((a, b) => {
    if (a.id && b.id) return a.id.localeCompare(b.id);
    return 0;
  });
  const options = ["", "", "", "", ""] as ExamQuestionDraft["options"];
  sorted.slice(0, 5).forEach((a, i) => {
    options[i] = a.text;
  });
  const correct = sorted.findIndex((a) => a.is_correct);
  const d = (q.difficulty ?? "medium") as ExamDifficulty;
  return {
    id: q.id,
    content: q.text ?? "",
    image_url: q.image_url ?? null,
    difficulty: ["easy", "medium", "hard"].includes(d) ? d : "medium",
    options,
    correctOptionIndex: correct >= 0 ? correct : 0,
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const diffConfig: Record<string, { label: string; cls: string }> = {
  easy: { label: "Хялбар", cls: "bg-emerald-50 text-emerald-700" },
  medium: { label: "Дунд", cls: "bg-amber-50 text-amber-700" },
  hard: { label: "Хүнд", cls: "bg-red-50 text-red-700" },
};

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === "string" ? params.examId : "";

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDraft, setEditDraft] = useState<ExamQuestionDraft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingExam, setDeletingExam] = useState(false);

  const load = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const data = await graphqlRequest<{ exam: ExamDetail | null }>(
        EXAM_QUERY,
        { id: examId },
      );
      setExam(data.exam);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ачаалахад алдаа.");
      setExam(null);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (q: QuestionRow) => {
    setEditId(q.id);
    setEditDraft(answersToDraft(q));
  };

  const closeEdit = () => {
    setEditId(null);
    setEditDraft(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ асуултыг устгах уу?")) return;
    setDeletingId(id);
    try {
      await graphqlRequest(DELETE_QUESTION, { id });
      toast.success("Асуулт устгагдлаа.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteExam = async () => {
    if (!exam || !confirm("Шалгалтыг бүр мөсөн устгах уу? Энэ үйлдэл буцаагдахгүй.")) return;
    setDeletingExam(true);
    try {
      await graphqlRequest(DELETE_EXAM, { id: exam.id });
      toast.success("Шалгалт устгагдлаа.");
      router.push("/exams");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа.");
      setDeletingExam(false);
    }
  };

  if (!examId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Буруу хаяг.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 max-w-2xl">
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Буцах
        </Link>
        <p className="mt-6 text-slate-600">Шалгалт олдсонгүй.</p>
      </div>
    );
  }

  const questions = exam.questions ?? [];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Шалгалтууд
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
          onClick={() => void handleDeleteExam()}
          disabled={deletingExam}
        >
          {deletingExam ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Устгах
        </Button>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Exam Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="p-6 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {exam.title}
            </h1>
            {exam.course && (
              <p className="mt-1 text-sm font-medium text-blue-600">
                {exam.course.code} · {exam.course.name}
              </p>
            )}
            {exam.description && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{exam.description}</p>
            )}
          </div>

          {/* Exam Stats */}
          <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
            <div className="flex flex-col items-center justify-center gap-1 p-4">
              <Calendar className="size-4 text-slate-400" />
              <p className="text-xs text-slate-400 font-medium">Эхлэх өдөр</p>
              <p className="text-sm font-semibold text-slate-800">{formatDate(exam.start_time)}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 p-4">
              <Clock className="size-4 text-slate-400" />
              <p className="text-xs text-slate-400 font-medium">Эхлэх цаг</p>
              <p className="text-sm font-semibold text-slate-800">{formatTime(exam.start_time)}</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 p-4">
              <BookOpen className="size-4 text-slate-400" />
              <p className="text-xs text-slate-400 font-medium">Хугацаа</p>
              <p className="text-sm font-semibold text-slate-800">{exam.duration} мин</p>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-slate-800">Асуултууд</h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {questions.length}
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <FileQuestion className="size-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">Асуулт байхгүй байна</p>
              <p className="text-xs text-slate-400">Доорх хэсгээс асуулт нэмнэ үү</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {questions.map((q, idx) => {
                const sorted = [...(q.answers ?? [])].sort((a, b) =>
                  a.id && b.id ? a.id.localeCompare(b.id) : 0
                );
                const diff = q.difficulty ? diffConfig[q.difficulty] : null;
                return (
                  <li
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 leading-snug">{q.text}</p>
                          {diff && (
                            <span className={`mt-1.5 inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${diff.cls}`}>
                              {diff.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          onClick={() => openEdit(q)}
                          aria-label="Засах"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          disabled={deletingId === q.id}
                          onClick={() => void handleDelete(q.id)}
                          aria-label="Устгах"
                        >
                          {deletingId === q.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Question Image */}
                    {q.image_url && (
                      <div className="px-5 pb-3">
                        <img
                          src={q.image_url}
                          alt="Асуултын зураг"
                          className="max-h-56 w-full rounded-xl object-contain bg-slate-50 border border-slate-100"
                        />
                      </div>
                    )}

                    {/* Answer Options */}
                    <div className="border-t border-slate-100 px-5 py-3">
                      <ol className="space-y-1.5">
                        {sorted.map((a, i) => (
                          <li
                            key={a.id}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                              a.is_correct
                                ? "bg-emerald-50 border border-emerald-200"
                                : "bg-slate-50 border border-transparent"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              a.is_correct
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className={`flex-1 ${a.is_correct ? "font-medium text-emerald-800" : "text-slate-700"}`}>
                              {a.text}
                            </span>
                            {a.is_correct && (
                              <Check className="size-4 text-emerald-600 flex-shrink-0" aria-label="Зөв" />
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Add Questions Section */}
        <QuestionCreator examId={exam.id} onSaved={() => void load()} />
      </div>

      {editId && editDraft && (
        <AddQuestionManually
          examId={exam.id}
          open={!!editId}
          onOpenChange={(o) => {
            if (!o) closeEdit();
          }}
          onSaved={() => {
            closeEdit();
            void load();
          }}
          mode="edit"
          questionId={editId}
          initialDraft={editDraft}
        />
      )}
    </div>
  );
}
