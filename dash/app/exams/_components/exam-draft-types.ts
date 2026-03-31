export type ExamDifficulty = "easy" | "medium" | "hard";

export type ExamQuestionDraft = {
  id: string;
  content: string;
  image_url?: string | null;
  difficulty: ExamDifficulty;
  options: [string, string, string, string, string];
  correctOptionIndex: number;
};

export function createEmptyQuestion(): ExamQuestionDraft {
  return {
    id: crypto.randomUUID(),
    content: "",
    image_url: null,
    difficulty: "medium",
    options: ["", "", "", "", ""],
    correctOptionIndex: 0,
  };
}
