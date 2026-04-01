"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  AlignLeft,
  ImageIcon,
  X,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ExamQuestionCard } from "../../_components/ExamQuestionCard";
import {
  createEmptyQuestion,
  type ExamQuestionDraft,
} from "../../_components/exam-draft-types";
import { parseRawTextToQuestions } from "./QuestionParser";
import { graphqlRequest } from "@/lib/graphql";
import { uploadImageToCloudinary } from "@/lib/utils/imageUpload";

// ─── GraphQL Mutations ─────────────────────────────────────────────────────

const ADD_MC_MUTATION = `#graphql
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

const ADD_OPEN_ENDED_MUTATION = `#graphql
  mutation AddOpenEndedQuestion(
    $exam_id: String!
    $content: String!
    $image_url: String
    $difficulty: QuestionDifficulty!
    $max_points: Int
  ) {
    addOpenEndedQuestion(
      exam_id: $exam_id
      content: $content
      image_url: $image_url
      difficulty: $difficulty
      max_points: $max_points
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
  const options = ["", "", "", "", ""] as [
    string,
    string,
    string,
    string,
    string,
  ];
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
  const hasUploading = Object.values(uploadingByDraft).some(Boolean);

  const [loadingOcr, setLoadingOcr] = useState(false);
  const [rawText, setRawText] = useState("");

  const [oeContent, setOeContent] = useState("");
  const [oeDifficulty, setOeDifficulty] = useState("medium");
  const [oeMaxPoints, setOeMaxPoints] = useState("1");
  const [oeImageUrl, setOeImageUrl] = useState<string | null>(null);
  const [oeUploading, setOeUploading] = useState(false);
  const [oeSaving, setOeSaving] = useState(false);

  const handleAddDraft = () => setDrafts([...drafts, createEmptyQuestion()]);
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setLoadingOcr(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
    try {
      const response = await fetch(
        "https://tesseract-provider-production.up.railway.app/ocr",
        {
          method: "POST",
          body: formData,
        },
      );
      if (!response.ok) throw new Error("Сервертэй холбогдоход алдаа гарлаа.");
      const data = await response.json();
      const parsed = parseRawTextToQuestions(data.aiCorrected || "");
      const newDrafts = parsed.map(parsedToDraft);
      if (newDrafts.length > 0) {
        setDrafts([
          ...drafts.filter((d) => d.content.trim() !== ""),
          ...newDrafts,
        ]);
        toast.success(`${newDrafts.length} асуулт танигдлаа.`);
        setActiveTab("manual");
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
      setDrafts([
        ...drafts.filter((d) => d.content.trim() !== ""),
        ...newDrafts,
      ]);
      setRawText("");
      setActiveTab("manual");
      toast.success(`${newDrafts.length} асуулт хөрвүүлэгдлээ.`);
    } else {
      toast.error("Асуултын бүтэц олдсонгүй.");
    }
  };

  const handleSaveAll = async () => {
    if (hasUploading) {
      toast.error("Зураг upload дуусаагүй байна.");
      return;
    }
    for (const d of drafts) {
      if (!d.content.trim()) {
        toast.error("Бүх асуултын текстийг оруулна уу.");
        return;
      }
    }
    setSaving(true);
    try {
      for (const draft of drafts) {
        await graphqlRequest(ADD_MC_MUTATION, {
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
    if (confirm("Бүх ноорог асуултыг устгах уу?"))
      setDrafts([createEmptyQuestion()]);
  };

  const handleSaveOpenEnded = async () => {
    if (!oeContent.trim()) {
      toast.error("Асуултын текст оруулна уу.");
      return;
    }
    const pts = parseInt(oeMaxPoints, 10);
    setOeSaving(true);
    try {
      await graphqlRequest(ADD_OPEN_ENDED_MUTATION, {
        exam_id: examId,
        content: oeContent.trim(),
        image_url: oeImageUrl ?? null,
        difficulty: oeDifficulty,
        max_points: pts,
      });
      toast.success("Задгай асуулт нэмэгдлээ.");
      setOeContent("");
      setOeImageUrl(null);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setOeSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200/60 bg-white/50 backdrop-blur-md transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40">
      <div className="border-b border-slate-100 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Асуулт нэмэх</h3>
            <p className="text-xs font-medium text-slate-500">
              Шалгалтын агуулгыг баяжуулж, оюутнуудад сорилт үүсгээрэй.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid h-12 w-full grid-cols-4 rounded-2xl bg-slate-100/50 p-1">
            {[
              { id: "manual", label: "Тест", icon: ListChecks },
              { id: "open", label: "Задгай", icon: AlignLeft },
              { id: "ocr", label: "Зургаас", icon: Sparkles },
              { id: "text", label: "Текстээс", icon: FileText },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="open" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Асуултын мэдээлэл
                    </Label>
                    <Textarea
                      className="min-h-30 resize-none rounded-3xl border-slate-200 bg-white p-5 text-sm transition-all focus:border-blue-500 focus:ring-0"
                      placeholder="Оюутнаас бичгээр хариулт авах асуултаа энд бичнэ үү..."
                      value={oeContent}
                      onChange={(e) => setOeContent(e.target.value)}
                      disabled={oeSaving}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Хүндрэл
                      </Label>
                      <Select
                        value={oeDifficulty}
                        onValueChange={setOeDifficulty}
                        disabled={oeSaving}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="easy">Хялбар</SelectItem>
                          <SelectItem value="medium">Дунд</SelectItem>
                          <SelectItem value="hard">Хүнд</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Дээд оноо
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-12 rounded-2xl border-slate-200 bg-white transition-all focus:border-blue-500 focus:ring-0"
                        value={oeMaxPoints}
                        onChange={(e) => setOeMaxPoints(e.target.value)}
                        disabled={oeSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Зураг
                      </Label>
                      <div className="flex gap-3">
                        {oeImageUrl ? (
                          <div className="group relative size-12 overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform active:scale-95">
                            <img
                              src={oeImageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                            <button
                              onClick={() => setOeImageUrl(null)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100"
                            >
                              <X size={14} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white text-[11px] font-bold text-slate-400 transition-all hover:border-blue-300 hover:bg-blue-50/20 active:scale-95">
                            <ImageIcon size={14} />
                            <span>Зураг</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={oeUploading || oeSaving}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setOeUploading(true);
                                try {
                                  const url =
                                    await uploadImageToCloudinary(file);
                                  setOeImageUrl(url);
                                } finally {
                                  setOeUploading(false);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => void handleSaveOpenEnded()}
                      disabled={oeSaving || oeUploading || !oeContent.trim()}
                      className="h-12 rounded-2xl bg-slate-900 px-8 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-black active:translate-y-0"
                    >
                      {oeSaving ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2" size={16} />
                      )}
                      {oeSaving ? "Хадгалж байна..." : "Асуултыг нэмэх"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ocr" className="mt-0">
                <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center transition-all hover:border-blue-300 hover:bg-blue-50/30">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-md">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Зургаас асуулт таних
                  </h4>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Шалгалтын материалын зургийг оруулан AI-аар таниулна.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleOcrUpload}
                    className="hidden"
                    id="creator-ocr"
                    disabled={loadingOcr}
                  />
                  <label htmlFor="creator-ocr">
                    <Button
                      asChild
                      size="lg"
                      className="mt-8 rounded-2xl bg-blue-600 px-8 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700"
                    >
                      <span>
                        {loadingOcr ? (
                          <Loader2 className="mr-2 animate-spin" />
                        ) : (
                          <UploadCloud className="mr-2" />
                        )}{" "}
                        {loadingOcr ? "Уншиж байна..." : "Зураг сонгох"}
                      </span>
                    </Button>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Текст өгөгдөл
                    </Label>
                    <Textarea
                      placeholder={"1. Асуулт?\na) Хариулт 1\nb) Хариулт 2..."}
                      className="min-h-55 resize-none rounded-3xl border-slate-200 p-6 text-sm leading-relaxed focus:border-blue-500 focus:ring-0"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleTextParse}
                      disabled={!rawText.trim()}
                      className="h-11 rounded-xl bg-slate-900 px-6 text-xs font-bold transition-transform hover:-translate-y-px"
                    >
                      <FileText className="mr-2" size={14} /> Асуулт болгох
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-0">
                <div className="space-y-6">
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
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleAddDraft}
                        className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-white font-bold text-slate-500 hover:border-blue-400 hover:bg-blue-50 active:scale-95 sm:flex-none"
                      >
                        <Plus className="mr-2" size={16} /> Асуулт нэмэх
                      </Button>
                      {drafts.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={clearDrafts}
                          className="size-11 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={() => void handleSaveAll()}
                      disabled={
                        saving ||
                        hasUploading ||
                        drafts.every((d) => !d.content.trim())
                      }
                      className="h-12 w-full rounded-2xl bg-blue-600 px-8 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2" size={16} />
                      )}
                      {saving
                        ? "Хадгалж байна..."
                        : `Бүх (${drafts.length}) асуултыг хадгалах`}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
