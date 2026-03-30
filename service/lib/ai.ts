import { openai } from "./openai";

export async function generateQuestions(topic: string) {
  const prompt = `
Generate 5 multiple choice questions about ${topic}.

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

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = res.choices[0].message.content!;
  return JSON.parse(content);
}
