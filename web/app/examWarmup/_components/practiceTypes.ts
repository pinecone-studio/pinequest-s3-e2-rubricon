export type PracticeMode = "exam" | "topic";

export type PracticeDifficulty = "easy" | "medium" | "hard";

export type PracticeExamSummary = {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  startTime: string | null;
};

export type PracticeSession = {
  examId: string;
  currentQuestion: number;
  answers: (number | null)[];
  showResults: boolean;
};

export type PracticeQuestion = {
  topic: string;
  difficulty: PracticeDifficulty;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};
