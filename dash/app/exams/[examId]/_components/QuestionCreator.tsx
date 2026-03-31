"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ExamQuestionCard } from "../../_components/ExamQuestionCard";
import {
  createEmptyQuestion,
  type ExamQuestionDraft,
} from "../../_components/exam-draft-types";
import { parseRawTextToQuestions } from "./QuestionParser";
import { graphqlRequest } from "@/lib/graphql";

const ADD_MUTATION = `#graphql
  mutation AddManualQuestion(
    $exam_id: String!
    $content: String!
    $image_url: String
    $difficulty: QuestionDifficulty!
    $options: [String!]!
    $correctOptionIndex: Int!
  ) {
    addManualQuestionToExam(
      exam_id: $exam_id
      content: $content
      image_url: $image_url
      difficulty: $difficulty
      options: $options
      correctOptionIndex: $correctOptionIndex
    ) {
      id
    }
  }
`;

function parsedToDraft(p: any): ExamQuestionDraft {
  const options = ["", "", "", "", ""] as [string, string, string, string, string];
  if (p.options && Array.isArray(p.options)) {
    p.options.slice(0, 5).forEach((opt: string, idx: number) => {
      options[idx] = opt;
    });
  }
  return {
    id: crypto.randomUUID(),
    content: p.text || "",
    image_url: null,
    difficulty: "medium",
    options,
    correctOptionIndex: 0,
  };
}

export function QuestionCreator({
  examId,
  onSaved,
}: {
  examId: string;
  onSaved: () => void;
}) {
  const [activeTab, setActiveTab] = useState("manual");
  const [drafts, setDrafts] = useState<ExamQuestionDraft[]>([
    createEmptyQuestion(),
  ]);
  const [saving, setSaving] = useState(false);
  const [uploadingByDraft, setUploadingByDraft] = useState<
    Record<string, boolean>
  >({});
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [rawText, setRawText] = useState("");
  const hasUploading = Object.values(uploadingByDraft).some(Boolean);

  const handleAddDraft = () => {
    setDrafts([...drafts, createEmptyQuestion()]);
  };

  const handleRemoveDraft = (index: number) => {
    const toRemove = drafts[index];
    setDrafts(drafts.filter((_, i) => i !== index));
    if (toRemove?.id) {
      setUploadingByDraft((prev) => {
        const next = { ...prev };
        delete next[toRemove.id];
        return next;
      });
    }
  };

  const handleChangeDraft = (index: number, next: ExamQuestionDraft) => {
    const newDrafts = [...drafts];
    newDrafts[index] = next;
    setDrafts(newDrafts);
  };

  const handleOcrUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoadingOcr(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch(
        "https://tesseract-provider-production.up.railway.app/ocr",
        { method: "POST", body: formData }
      );
      if (!response.ok) throw new Error("Сервертэй холбогдоход алдаа гарлаа.");
      const data = await response.json();
      const parsed = parseRawTextToQuestions(data.aiCorrected || "");
      const newDrafts = parsed.map(parsedToDraft);
      if (newDrafts.length > 0) {
        setDrafts([...drafts.filter((d) => d.content.trim() !== ""), ...newDrafts]);
        toast.success(`${newDrafts.length} асуулт танигдлаа.`);
        setActiveTab("manual");
      } else {
        toast.warning("Асуулт танигдсангүй, текст рүү хуулагдлаа.");
        setRawText(data.aiCorrected || "");
        setActiveTab("text");
      }
    } catch (err: any) {
      toast.error(err.message || "Оруулж чадсангүй");
    } finally {
      setLoadingOcr(false);
    }
  };

  const handleTextParse = () => {
    const parsed = parseRawTextToQuestions(rawText);
    const newDrafts = parsed.map(parsedToDraft);
    if (newDrafts.length > 0) {
      setDrafts([...drafts.filter((d) => d.content.trim() !== ""), ...newDrafts]);
      setRawText("");
      setActiveTab("manual");
      toast.success(`${newDrafts.length} асуулт хөрвүүлэгдлээ.`);
    } else {
      toast.error("Асуултын бүтэц олдсонгүй.");
    }
  };

  const handleSaveAll = async () => {
    if (hasUploading) {
      toast.error("Зураг upload дуусаагүй байна. Түр хүлээгээд дахин оролдоно уу.");
      return;
    }
    for (let j = 0; j < drafts.length; j++) {
      const d = drafts[j];
      if (!d.content.trim()) {
        toast.error(`Асуулт ${j + 1}-н текстийг оруулна уу.`);
        return;
      }
      for (let i = 0; i < 5; i++) {
        if (!d.options[i]?.trim()) {
          d.options[i] = "-";
        }
      }
    }

    setSaving(true);
    try {
      for (const draft of drafts) {
        await graphqlRequest(ADD_MUTATION, {
          exam_id: examId,
          content: draft.content,
          image_url: draft.image_url ?? null,
          difficulty: draft.difficulty,
          options: [...draft.options],
          correctOptionIndex: draft.correctOptionIndex,
        });
      }
      toast.success("Асуултууд амжилттай хадгалагдлаа.");
      setDrafts([createEmptyQuestion()]);
      setUploadingByDraft({});
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const clearDrafts = () => {
    if (confirm("Бүх ноорог асуултыг устгах уу?")) {
      setDrafts([createEmptyQuestion()]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">
          Асуулт нэмэх
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Гараар бичих, зургаас таних, эсвэл текстээс хөрвүүлэх
        </p>
      </div>

      <div className="p-6">
        {/* Import Method Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="manual"
              className="py-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Plus className="size-4 mr-1.5" />
              Гараар
            </TabsTrigger>
            <TabsTrigger
              value="ocr"
              className="py-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <UploadCloud className="size-4 mr-1.5" />
              Зургаас
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="py-2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <FileText className="size-4 mr-1.5" />
              Текстээс
            </TabsTrigger>
          </TabsList>

          {/* OCR Tab */}
          <TabsContent value="ocr" className="mt-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
              <UploadCloud className="size-10 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700 mb-1">Зургаас асуулт таних</p>
              <p className="text-sm text-slate-500 mb-4">
                Шалгалтын материалын зургийг оруулахад автоматаар асуулт болгоно
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleOcrUpload}
                className="hidden"
                id="ocr-upload"
                disabled={loadingOcr}
              />
              <label htmlFor="ocr-upload">
                <Button
                  asChild
                  disabled={loadingOcr}
                  size="sm"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>
                    {loadingOcr && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {loadingOcr ? "Тайлж байна..." : "Зураг сонгох"}
                  </span>
                </Button>
              </label>
            </div>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="mt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Дугаарласан асуулт болон хариултуудаа энд бичнэ үү:
              </p>
              <Textarea
                placeholder={"1. Монгол улсын нийслэл?\na) Улаанбаатар\nb) Дархан\nc) Эрдэнэт\nd) Ховд\ne) Дорнод\n\n2. Дараагийн асуулт..."}
                className="min-h-[180px] bg-white text-sm resize-none border-slate-200 rounded-lg"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleTextParse}
                  disabled={!rawText.trim()}
                  size="sm"
                  className="gap-2 bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <FileText className="size-4" />
                  Асуулт болгох
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Manual Tab hint */}
          <TabsContent value="manual" className="mt-0" />
        </Tabs>

        {/* Draft Questions */}
        <div className="space-y-4">
          {drafts.map((draft, idx) => (
            <ExamQuestionCard
              key={draft.id}
              index={idx}
              question={draft}
              onChange={(next) => handleChangeDraft(idx, next)}
              onRemove={() => handleRemoveDraft(idx)}
              canRemove={drafts.length > 1}
              onUploadStateChange={(isUploading) =>
                setUploadingByDraft((prev) => ({
                  ...prev,
                  [draft.id]: isUploading,
                }))
              }
            />
          ))}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-dashed border-2 hover:bg-slate-50 text-slate-600 w-full sm:w-auto"
                onClick={handleAddDraft}
              >
                <Plus className="size-4" />
                Асуулт нэмэх
              </Button>
              {drafts.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Бүгдийг устгах"
                  className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                  onClick={clearDrafts}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
              onClick={() => void handleSaveAll()}
              disabled={saving || hasUploading || drafts.length === 0}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {saving ? "Хадгалж байна..." : `Хадгалах (${drafts.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
