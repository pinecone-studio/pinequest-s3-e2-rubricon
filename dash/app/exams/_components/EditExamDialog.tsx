"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { graphqlRequest } from "@/lib/graphql";
import { Loader2, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import type { ExamCardExam } from "./ExamCard";
import { uploadImageToCloudinary } from "@/lib/utils/imageUpload";

const COURSES_QUERY = `#graphql
  query CoursesForExam {
    courses {
      id
      name
      code
    }
  }
`;

const UPDATE_EXAM = `#graphql
  mutation UpdateExam(
    $id: String!
    $course_id: String
    $title: String
    $start_time: String
    $end_time: String
    $duration: Int
    $image_url: String
  ) {
    updateExam(
      id: $id
      course_id: $course_id
      title: $title
      start_time: $start_time
      end_time: $end_time
      duration: $duration
      image_url: $image_url
    ) {
      id
    }
  }
`;

type CourseRow = { id: string; name: string; code: string };

export const EditExamDialog = ({
  exam,
  open,
  onOpenChange,
  onUpdated,
}: {
  exam: ExamCardExam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [title, setTitle] = useState(exam.title);
  const [courseId, setCourseId] = useState(exam.courseId);

  const parsedStart = new Date(exam.rawStartTime);
  const initialDate = Number.isNaN(parsedStart.getTime()) ? "" : parsedStart.toISOString().split("T")[0];
  const initialTime = Number.isNaN(parsedStart.getTime()) ? "09:00" : parsedStart.toTimeString().slice(0, 5);
  
  const [examDate, setExamDate] = useState(initialDate);
  const [examTime, setExamTime] = useState(initialTime);
  const [durationMinutes, setDurationMinutes] = useState(String(exam.rawDuration));
  const [imageUrl, setImageUrl] = useState(exam.image_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setCoursesLoading(true);
      graphqlRequest<{ courses: CourseRow[] | null }>(COURSES_QUERY)
        .then((data) => setCourses(data.courses ?? []))
        .catch((e) =>
          toast.error(
            e instanceof Error ? e.message : "Курсууд ачаалагдаагүй байна."
          )
        )
        .finally(() => setCoursesLoading(false));
    }
  }, [open]);

  const buildStartEndIso = () => {
    if (!examDate || !examTime) {
      throw new Error("Өдөр болон цагийг сонгоно уу.");
    }
    const start = new Date(`${examDate}T${examTime}:00`);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Огноо эсвэл цаг буруу байна.");
    }
    const dur = Number.parseInt(durationMinutes, 10);
    if (!Number.isFinite(dur) || dur <= 0) {
      throw new Error("Хугацаа зөв сонгоно уу.");
    }
    const end = new Date(start.getTime() + dur * 60 * 1000);
    return {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: dur,
    };
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error("Шалгалтын нэр оруулна уу.");
      return;
    }
    if (!courseId) {
      toast.error("Курс сонгоно уу.");
      return;
    }

    let timing: { start_time: string; end_time: string; duration: number };
    try {
      timing = buildStartEndIso();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Огноо алдаатай.");
      return;
    }

    setSaving(true);
    try {
      await graphqlRequest(UPDATE_EXAM, {
        id: exam.id,
        course_id: courseId,
        title: title.trim(),
        start_time: timing.start_time,
        end_time: timing.end_time,
        duration: timing.duration,
        image_url: imageUrl,
      });
      toast.success("Шалгалт шинэчлэгдлээ.");
      onOpenChange(false);
      onUpdated();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Шинэчлэхэд алдаа гарлаа."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Шалгалт засах</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <FieldGroup className="gap-4">
            <Field>
              <Label htmlFor="edit-exam-name">Шалгалтын нэр</Label>
              <Input
                id="edit-exam-name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </Field>
            <Field>
              <Label htmlFor="edit-course">Курс</Label>
              <Select
                value={courseId || undefined}
                onValueChange={setCourseId}
                disabled={saving || coursesLoading}
              >
                <SelectTrigger id="edit-course">
                  <SelectValue placeholder="Курс сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="edit-date">Эхлэх өдөр</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={saving}
                />
              </Field>
              <Field>
                <Label htmlFor="edit-time">Эхлэх цаг</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  disabled={saving}
                />
              </Field>
            </div>
            <Field>
              <Label htmlFor="edit-duration">Үргэлжлэх хугацаа</Label>
              <Select
                value={durationMinutes}
                onValueChange={setDurationMinutes}
                disabled={saving}
              >
                <SelectTrigger id="edit-duration">
                  <SelectValue placeholder="Сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 цаг</SelectItem>
                  <SelectItem value="120">2 цаг</SelectItem>
                  <SelectItem value="180">3 цаг</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
                <Label>Шалгалтын ковер зураг (заавал биш)</Label>
                <div className="mt-2 flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative size-20 rounded-lg border overflow-hidden">
                      <img src={imageUrl} alt="Exam cover" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 hover:bg-white"
                      >
                        <X size={14} className="text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center size-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                      <ImageIcon className="size-6 text-slate-400" />
                      <span className="text-[10px] text-slate-500 mt-1">Зураг</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const url = await uploadImageToCloudinary(file);
                            setImageUrl(url);
                          } catch (err) {
                            toast.error("Зураг хуулахад алдаа гарлаа.");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                  {uploading && <Loader2 className="size-5 animate-spin text-[#006fee]" />}
                </div>
              </Field>
          </FieldGroup>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Болих
          </Button>
          <Button
            onClick={() => void handleUpdate()}
            disabled={saving}
            className="bg-[#006fee] hover:bg-[#005bc4] text-white"
          >
            {saving ? (
               <><Loader2 className="size-4 animate-spin mr-2 inline" /> Хадгалж байна…</>
            ) : (
               "Хадгалах"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
