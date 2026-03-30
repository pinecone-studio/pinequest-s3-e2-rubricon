import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const { courseId, topic } = await req.json();

  // 1. AI generate
  const questions = await generateQuestions(topic);

  // 2. exam үүсгэнэ
  const { data: exam } = await supabase
    .from("exams")
    .insert({
      course_id: courseId,
      title: "AI Mock Exam",
      type: "mock",
    })
    .select()
    .single();

  // 3. question loop
  for (const q of questions) {
    const { data: question } = await supabase
      .from("questions")
      .insert({
        text: q.question,
        type: q.type,
        difficulty: "medium",
      })
      .select()
      .single();

    // answers
    for (const a of q.answers) {
      await supabase.from("answers").insert({
        question_id: question.id,
        text: a.text,
        is_correct: a.correct,
      });
    }

    // exam_questions
    await supabase.from("exam_questions").insert({
      exam_id: exam.id,
      question_id: question.id,
    });
  }

  return NextResponse.json({ examId: exam.id });
}
