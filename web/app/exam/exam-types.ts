export type ExamChoice = {
  id: string;
  label: string;
  answerId?: string;
};

export type ExamQuestion = {
  id: number;
  questionId: string;
  question: string;
  type: "Short Answer" | "Multiple Choice" | "True/False";
  difficulty: "Easy" | "Medium" | "Hard";
  choices?: ExamChoice[];
  correctAnswer: string;
};

export type ExamMeta = {
  id: string;
  title: string;
  subtitle?: string;
  durationSeconds: number;
};
