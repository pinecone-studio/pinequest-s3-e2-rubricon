const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

type GeminiGenerateResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
    finishReason?: string;
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing in the service environment.",
    );
  }

  return apiKey;
};

export async function generateGeminiJson(prompt: string) {
  const apiKey = getGeminiApiKey();

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = (await response.json()) as GeminiGenerateResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Gemini request failed with status ${response.status}.`,
    );
  }

  if (payload.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked the prompt: ${payload.promptFeedback.blockReason}.`,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned no text content.");
  }

  return text;
}
