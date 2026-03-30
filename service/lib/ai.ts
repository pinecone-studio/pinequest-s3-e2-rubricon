import { generateGeminiJson } from "./gemini";

export type GeneratedPracticeQuestion = {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type GeneratedExamQuestion = {
  question: string;
  type: string;
  answers: {
    text: string;
    correct: boolean;
  }[];
};

type SourceExamQuestion = {
  question: string;
  options: string[];
  correctAnswer: string | null;
};

const parseJsonContent = <T,>(content: string): T => {
  const normalized = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  return JSON.parse(normalized) as T;
};

export async function generateQuestions(
  topic: string,
): Promise<GeneratedExamQuestion[]> {
  const prompt = `
Generate 5 multiple choice questions about ${topic}.
Write everything in Mongolian.

Return JSON ONLY like:
[
  {
    "question": "text",
    "type": "single_choice",
    "answers": [
      {"text": "A", "correct": true},
      {"text": "B", "correct": false}
    ]
  }
]
`;

  const content = await generateGeminiJson(prompt);
  return parseJsonContent<GeneratedExamQuestion[]>(content);
}

export async function generatePracticeQuestionsFromTopic(
  topic: string,
  difficulty: GeneratedPracticeQuestion["difficulty"] = "medium",
) {
  const prompt = `
Generate 5 multiple choice practice questions about "${topic}".
Difficulty should be mostly ${difficulty}.

Return JSON ONLY in this exact shape:
[
  {
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Short explanation"
  }
]

Rules:
- Use exactly 4 options per question.
- "correctAnswer" must be the zero-based index of the correct option.
- Keep explanations short and clear.
- Write "topic", "question", all "options", and "explanation" in Mongolian.
- Return valid JSON only.
`;

  const content = await generateGeminiJson(prompt);
  return parseJsonContent<GeneratedPracticeQuestion[]>(content);
}

export async function generatePracticeQuestionsFromExam(
  examTitle: string,
  sourceQuestions: SourceExamQuestion[],
  difficulty: GeneratedPracticeQuestion["difficulty"] = "medium",
) {
  const prompt = `
You are creating a practice warmup for the exam "${examTitle}".
You must stay strictly within the same academic subject and concepts as the source exam questions.
Do not introduce unrelated subjects or general knowledge.
If the source questions are about programming, algorithms, math, biology, or any other field, every generated question must remain in that same field.
Never mix in geography, history, politics, social science, or other disciplines unless they are clearly present in the source questions.
Use the source exam questions below as the only source of truth for topic scope.
Do not copy the source questions verbatim, but create very similar questions that test the same concepts, terminology, and style.

Source questions:
${JSON.stringify(sourceQuestions, null, 2)}

Generate exactly 5 multiple choice practice questions that match the source exam's:
- subject area
- concepts
- terminology
- difficulty level
- question style

Topic labels must be short and must reflect one of the concepts already present in the source questions.
Difficulty should be mostly ${difficulty}.
Write all generated content in Mongolian.

Return JSON ONLY in this exact shape:
[
  {
    "topic": "Topic name",
    "difficulty": "${difficulty}",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Short explanation"
  }
]

Rules:
- Use exactly 4 options per question.
- "correctAnswer" must be the zero-based index of the correct option.
- Keep explanations short and clear.
- Every generated question must be answerable within the same course/topic area as the source questions.
- If you are unsure, stay closer to the source questions instead of broadening the subject.
- Write "topic", "question", all "options", and "explanation" in Mongolian.
- Return valid JSON only.
`;

  const content = await generateGeminiJson(prompt);
  return parseJsonContent<GeneratedPracticeQuestion[]>(content);
}
