import { NextResponse } from "next/server";
import {
  generatePracticeQuestionsFromExam,
  generatePracticeQuestionsFromTopic,
  generateQuestions,
} from "@/lib/ai";
import { createClient } from "@supabase/supabase-js";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// 🔹 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 🔹 SQS
const sqs = new SQSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

// 🔹 Error helper
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Failed to generate exam.";
};
console.log("SQS_URL:", process.env.SQS_URL);
console.log("ACCESS_KEY exists:", !!process.env.AWS_ACCESS_KEY);
console.log("SECRET_KEY exists:", !!process.env.AWS_SECRET_KEY);

// 🔥 MAIN POST
export async function POST(req: Request) {
  try {
    const { courseId, topic, examId, difficulty } = await req.json();

    // =========================================
    // 🔥 1. SQS MODE (AI async generate)
    // =========================================
    if (courseId && topic && !examId) {
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.SQS_URL!,
          MessageBody: JSON.stringify({
            type: "GENERATE_EXAM",
            courseId,
            topic,
          }),
        }),
      );

      return NextResponse.json({
        message: "Exam generation started (SQS)",
      });
    }

    // =========================================
    // 🧠 2. PRACTICE FROM EXISTING EXAM
    // =========================================
    if (examId) {
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("id, title")
        .eq("id", examId)
        .single();

      if (examError || !exam) {
        return NextResponse.json({ error: "Exam not found." }, { status: 404 });
      }

      const { data: examQuestions } = await supabase
        .from("exam_questions")
        .select("question_id")
        .eq("exam_id", examId);

      const questionIds = (examQuestions ?? []).map((q) => q.question_id);

      const { data: questions } = await supabase
        .from("questions")
        .select("id, text")
        .in("id", questionIds);

      const { data: answers } = await supabase
        .from("answers")
        .select("question_id, text, is_correct")
        .in("question_id", questionIds);

      const sourceQuestions =
        questions?.map((q) => ({
          question: q.text,
          options:
            answers?.filter((a) => a.question_id === q.id).map((a) => a.text) ??
            [],
          correctAnswer:
            answers?.find((a) => a.question_id === q.id && a.is_correct)
              ?.text ?? null,
        })) ?? [];

      const generatedQuestions = await generatePracticeQuestionsFromExam(
        exam.title ?? "Exam",
        sourceQuestions,
        difficulty,
      );

      return NextResponse.json({
        examId: exam.id,
        questions: generatedQuestions,
      });
    }

    // =========================================
    // 🧠 3. PRACTICE FROM TOPIC
    // =========================================
    if (topic && !courseId) {
      const generatedQuestions = await generatePracticeQuestionsFromTopic(
        topic,
        difficulty,
      );

      return NextResponse.json({
        topic,
        questions: generatedQuestions,
      });
    }

    // =========================================
    // 🧠 4. DIRECT GENERATE (NO SQS)
    // =========================================
    if (!courseId || !topic) {
      return NextResponse.json(
        { error: "courseId/topic or examId required" },
        { status: 400 },
      );
    }

    const questions = await generateQuestions(topic);

    const { data: exam } = await supabase
      .from("exams")
      .insert({
        course_id: courseId,
        title: "AI Mock Exam",
        type: "mock",
      })
      .select()
      .single();

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

      for (const a of q.answers) {
        await supabase.from("answers").insert({
          question_id: question.id,
          text: a.text,
          is_correct: a.correct,
        });
      }

      await supabase.from("exam_questions").insert({
        exam_id: exam.id,
        question_id: question.id,
      });
    }

    return NextResponse.json({ examId: exam?.id });
  } catch (error) {
    console.error("generate-exam failed", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
