import { NextRequest } from "next/server";

const DEFAULT_SERVICE_ORIGIN = (() => {
  const graphqlUrl = process.env.GRAPHQL_SERVICE_URL;

  if (!graphqlUrl) {
    return "http://127.0.0.1:4000";
  }

  try {
    return new URL(graphqlUrl).origin;
  } catch {
    return "http://127.0.0.1:4000";
  }
})();

const GENERATE_EXAM_SERVICE_URL =
  process.env.GENERATE_EXAM_SERVICE_URL ??
  `${DEFAULT_SERVICE_ORIGIN}/api/generate-exam`;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const auth = request.headers.get("authorization");

  try {
    const response = await fetch(GENERATE_EXAM_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
      cache: "no-store",
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      const preview = text.replace(/\s+/g, " ").trim().slice(0, 200);

      return new Response(
        JSON.stringify({
          error: `Generate-exam service returned non-JSON response (${response.status}). ${preview || "No response body."}`,
        }),
        {
          status: response.status || 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: `Unable to reach generate-exam service at ${GENERATE_EXAM_SERVICE_URL}. Check that your backend is running and GENERATE_EXAM_SERVICE_URL is correct.`,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
