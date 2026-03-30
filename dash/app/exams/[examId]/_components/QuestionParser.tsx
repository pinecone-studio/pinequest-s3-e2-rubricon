import React from "react";

export const QuestionParser = () => {
  return <div>QuestionParser</div>;
};

type ParsedQuestion = {
  text: string;
  options: string[];
  type: "single_choice";
};

const SCORE_TAG_RE = /\/\s*\d+\s*оноо\s*\//i;

const normalizeOptionLabel = (raw: string) => {
  const ch = raw.trim().toUpperCase();
  // Accept both Latin and Cyrillic labels commonly used in MN tests
  // A/А, B/В, C/С, D/Д, E/Е
  if (ch === "А") return "A";
  if (ch === "В") return "B";
  if (ch === "С") return "C";
  if (ch === "Д") return "D";
  if (ch === "Е") return "E";
  if (["A", "B", "C", "D", "E"].includes(ch)) return ch as "A" | "B" | "C" | "D" | "E";
  return null;
};

const optionLabelToIndex = (label: "A" | "B" | "C" | "D" | "E") => {
  switch (label) {
    case "A":
      return 0;
    case "B":
      return 1;
    case "C":
      return 2;
    case "D":
      return 3;
    case "E":
      return 4;
  }
};

function extractOptionsFromLine(line: string): Array<{ label: "A" | "B" | "C" | "D" | "E"; text: string }> {
  // Supports:
  // - "A. foo" / "A) foo" / "A: foo" / "A - foo"
  // - "А. foo" / "В) bar" (Cyrillic)
  // - multiple options in one line: "A. foo B. bar C. baz"
  // Note: with the `u` flag, escaping non-special chars like `\:` is a syntax error.
  const re = /(^|\s)([A-EАВСДЕ])(?:[.):]\s*|(?:\s*-\s+))/giu;
  const matches: Array<{ idx: number; label: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    matches.push({ idx: m.index + (m[1]?.length ?? 0), label: m[2] });
  }
  if (matches.length === 0) return [];

  const out: Array<{ label: "A" | "B" | "C" | "D" | "E"; text: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const norm = normalizeOptionLabel(cur.label);
    if (!norm) continue;

    const start = cur.idx;
    // Find end of marker: from start, skip "X." / "X)" / "X:" / "X - "
    const markerEnd = (() => {
      const after = line.slice(start);
      const mm = after.match(/^([A-EАВСДЕ])(?:[.):]\s*|(?:\s*-\s+))/iu);
      return mm ? start + mm[0].length : start;
    })();
    const end = next ? next.idx : line.length;
    const text = line.slice(markerEnd, end).trim();
    if (text) out.push({ label: norm, text });
  }
  return out;
}

export const parseRawTextToQuestions = (text: string): ParsedQuestion[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const questions: ParsedQuestion[] = [];

  let currentQuestion: ParsedQuestion | null = null;

  lines.forEach((line) => {
    // 1. Асуулт эхэлж байгааг таних (Жишээ нь: "4. " эсвэл "4) ")
    // Also supports "4 - " or "4 " which often appears in OCR.
    const questionMatch = line.match(/^(\d+)(?:[\.\)]\s*|\s*-\s*|\s+)(.*)/);

    if (questionMatch) {
      // Шинэ асуулт эхэлж байна
      if (currentQuestion) questions.push(currentQuestion);
      const raw = (questionMatch[2] ?? "").trim();
      const inlineOptions = extractOptionsFromLine(raw);
      let qText = raw;
      if (inlineOptions.length > 0) {
        // Keep everything before the first option marker as question text
        qText = raw
          .slice(
            0,
            Math.max(
              0,
              inlineOptions[0]
                ? raw.search(
                    /(^|\s)([A-EАВСДЕ])(?:[.):]\s*|(?:\s*-\s+))/iu,
                  )
                : raw.length,
            ),
          )
          .trim();
      }
      qText = qText.replace(SCORE_TAG_RE, "").trim();
      currentQuestion = {
        text: qText,
        options: [],
        type: "single_choice",
      };
      if (inlineOptions.length > 0) {
        const byIndex = new Map<number, string>();
        for (const opt of inlineOptions) {
          byIndex.set(optionLabelToIndex(opt.label), opt.text);
        }
        // push in A..E order
        for (let i = 0; i < 5; i++) {
          const t = byIndex.get(i);
          if (typeof t === "string" && t.trim()) currentQuestion.options.push(t.trim());
        }
      }
    } else if (currentQuestion) {
      const extracted = extractOptionsFromLine(line);
      if (extracted.length > 0) {
        const byIndex = new Map<number, string>();
        for (const opt of extracted) {
          byIndex.set(optionLabelToIndex(opt.label), opt.text);
        }
        for (let i = 0; i < 5; i++) {
          const t = byIndex.get(i);
          if (typeof t === "string" && t.trim()) currentQuestion.options.push(t.trim());
        }
      } else {
        // Хэрэв асуултын текст олон мөр дамжсан бол залгах
        const cleaned = line.replace(SCORE_TAG_RE, "").trim();
        if (cleaned) currentQuestion.text += " " + cleaned;
      }
    }
  });

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
};
