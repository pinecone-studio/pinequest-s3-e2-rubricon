"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, UploadCloud, FileText, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ExamQuestionCard } from "../../_components/ExamQuestionCard";
import { createEmptyQuestion, type ExamQuestionDraft } from "../../_components/exam-draft-types";
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

type ParsedQuestion = {
  text?: string;
  options?: string[];
};

function parsedToDraft(p: ParsedQuestion): ExamQuestionDraft {
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

export function QuestionCreator({ examId, onSaved }: { examId: string; onSaved: () => void }) {
  const [activeTab, setActiveTab] = useState("manual");
  const [drafts, setDrafts] = useState<ExamQuestionDraft[]>([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [uploadingByDraft, setUploadingByDraft] = useState<Record<string, boolean>>({});
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

  const handleOcrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Сервертэй холбогдоход алдаа гарлаа.");

      const data = await response.json();
      const parsed = parseRawTextToQuestions(data.aiCorrected || "");
      const newDrafts = parsed.map(parsedToDraft);
      
      if (newDrafts.length > 0) {
        setDrafts([...drafts.filter(d => d.content.trim() !== ""), ...newDrafts]);
        toast.success(`${newDrafts.length} асуулт танигдлаа.`);
      } else {
        toast.warning("Асуулт танигдсангүй, текст рүү хуулагдлаа.");
        setRawText(data.aiCorrected || "");
        setActiveTab("text");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Оруулж чадсангүй");
    } finally {
      setLoadingOcr(false);
    }
  };

  const handleTextParse = () => {
    const parsed = parseRawTextToQuestions(rawText);
    const newDrafts = parsed.map(parsedToDraft);
    if (newDrafts.length > 0) {
      setDrafts([...drafts.filter(d => d.content.trim() !== ""), ...newDrafts]);
      setRawText("");
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
    // Basic validation
    for (let j = 0; j < drafts.length; j++) {
      const d = drafts[j];
      if (!d.content.trim()) {
        toast.error(`Асуулт ${j + 1}-н текстийг оруулна уу.`);
        return;
      }
      for (let i = 0; i < 5; i++) {
        if (!d.options[i]?.trim()) {
          // Fill empty ones with fallback to avoid blocking
          d.options[i] = "-"; 
        }
      }
    }

    setSaving(true);
    try {
      for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i];
        console.log(`Saving question ${i+1}/${drafts.length}:`, {
          content: draft.content,
          image_url: draft.image_url,
          difficulty: draft.difficulty
        });
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
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          Шинэ асуулт нэмэх
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Google Form шиг эндээс шууд асуултаа бүрдүүлэх боломжтой.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto h-auto p-1 bg-slate-100/80 mb-6">
          <TabsTrigger value="manual" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Plus className="size-4 mr-2" />
            Гараар
          </TabsTrigger>
          <TabsTrigger value="ocr" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UploadCloud className="size-4 mr-2" />
            Зураг
          </TabsTrigger>
          <TabsTrigger value="text" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="size-4 mr-2" />
            Текст
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-0">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center text-sm text-muted-foreground mb-4">
            Доорх хэсэгт асуултуудаа гараар нэмж бичээрэй.
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="mt-0">
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-6 text-center mb-4 transition-all hover:bg-[#e0f2fe]">
            <div className="flex flex-col items-center justify-center gap-3">
              <UploadCloud className="h-10 w-10 text-[#0284c7]" />
              <div className="space-y-1">
                <p className="font-medium text-[#0369a1]">Зургаас асуулт таних (Railway OCR + AI)</p>
                <p className="text-sm text-[#0284c7]/80">Шалгалтын материалын зургийг сонгож оруулна уу.</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleOcrUpload}
                className="hidden"
                id="inline-ocr-upload"
                disabled={loadingOcr}
              />
              <label htmlFor="inline-ocr-upload" className="mt-2">
                <Button asChild disabled={loadingOcr} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white cursor-pointer">
                  <span>
                    {loadingOcr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Зураг сонгох
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-0">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-600 mb-3 font-medium">Текстийн бүтэцтэй хуулсан асуултаа энд буулгана уу:</p>
            <Textarea
              placeholder={"1. Монгол улсын нийслэл?\na) Улаанбаатар\nb) Дархан\n..."}
              className="min-h-[160px] bg-white text-sm"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <Button onClick={handleTextParse} disabled={!rawText.trim()} variant="secondary" className="gap-2 shrink-0">
                <FileText className="size-4" />
                Хөрвүүлэх
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-6">
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-2 border-dashed border-2 hover:bg-slate-50 w-full sm:w-auto text-slate-600"
              onClick={handleAddDraft}
            >
              <Plus className="size-4" />
              Бас нэг асуулт нэмэх
            </Button>
            {drafts.length > 1 && (
               <Button
                 variant="ghost"
                 size="icon"
                 title="Бүгдийг устгах"
                 className="text-muted-foreground hover:text-destructive shrink-0"
                 onClick={clearDrafts}
               >
                 <Trash2 className="size-4" />
               </Button>
            )}
          </div>
          <Button
            className="w-full sm:w-auto bg-[#006fee] hover:bg-[#005bc4] text-white gap-2 px-8 shadow-md"
            onClick={() => void handleSaveAll()}
            disabled={saving || hasUploading || drafts.length === 0}
            size="lg"
          >
            {saving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}
            Асуултуудыг хадгалах ({drafts.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
