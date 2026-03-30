import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing in the service environment.",
    );
  }

  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }

  return openaiInstance;
}
