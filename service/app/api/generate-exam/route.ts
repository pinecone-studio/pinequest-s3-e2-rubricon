import { NextResponse } from "next/server";
import {
  generatePracticeQuestionsFromExam,
  generatePracticeQuestionsFromTopic,
  generateQuestions,
} from "@/lib/ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : null,
      typeof maybeError.details === "string" ? maybeError.details : null,
      typeof maybeError.hint === "string" ? maybeError.hint : null,
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Failed to generate exam.";
};

export async function POST(req: Request) {
  try {
    const { courseId, topic, examId, difficulty } = await req.json();

    if (examId) {
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("id, title")
        .eq("id", examId)
        .single();

      if (examError || !exam) {
        return NextResponse.json(
          { error: "Exam not found." },
          { status: 404 },
        );
      }

      const { data: examQuestions, error: examQuestionsError } = await supabase
        .from("exam_questions")
        .select("question_id, order_index")
        .eq("exam_id", examId)
        .order("order_index", { ascending: true });

      if (examQuestionsError) {
        throw examQuestionsError;
      }

      const questionIds = (examQuestions ?? [])
        .map((item) => item.question_id)
        .filter(Boolean);

      if (questionIds.length === 0) {
        return NextResponse.json(
          { error: "This exam has no source questions yet." },
          { status: 400 },
        );
      }

      const [{ data: questions, error: questionsError }, { data: answers, error: answersError }] =
        await Promise.all([
          supabase
            .from("questions")
            .select("id, text")
            .in("id", questionIds),
          supabase
            .from("answers")
            .select("question_id, text, is_correct")
            .in("question_id", questionIds),
        ]);

      if (questionsError) {
        throw questionsError;
      }

      if (answersError) {
        throw answersError;
      }

      const questionsById = new Map(
        (questions ?? []).map((question) => [question.id, question]),
      );
      const answersByQuestionId = new Map<
        string,
        {
          text: string;
          is_correct: boolean;
        }[]
      >();

      for (const answer of answers ?? []) {
        const existing = answersByQuestionId.get(answer.question_id) ?? [];
        existing.push(answer);
        answersByQuestionId.set(answer.question_id, existing);
      }

      const sourceQuestions = questionIds
        .map((questionId) => {
          const question = questionsById.get(questionId);

          if (!question) {
            return null;
          }

          const orderedAnswers = [
            ...(answersByQuestionId.get(questionId) ?? []),
          ];

          return {
            question: question.text,
            options: orderedAnswers.map((answer) => answer.text),
            correctAnswer:
              orderedAnswers.find((answer) => answer.is_correct)?.text ?? null,
          };
        })
        .filter(
          (
            value,
          ): value is {
            question: string;
            options: string[];
            correctAnswer: string | null;
          } => value !== null,
        );

      const generatedQuestions = await generatePracticeQuestionsFromExam(
        exam.title ?? "Exam practice",
        sourceQuestions,
        difficulty,
      );

      return NextResponse.json({
        examId: exam.id,
        examTitle: exam.title,
        questions: generatedQuestions,
      });
    }

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

    if (!courseId || !topic) {
      return NextResponse.json(
        { error: "courseId/topic or examId is required." },
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

    return NextResponse.json({ examId: exam.id });
  } catch (error) {
    console.error("generate-exam failed", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
