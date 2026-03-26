import { supabase } from "@/lib/supabase";

type CreateExamArgs = {
  course_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration: number;
};

export const examMutations = {
  createExam: async (_: unknown, args: CreateExamArgs) => {
    const { data, error } = await supabase
      .from("exams")
      .insert([args])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  createExamWithQuestions: async (
    _: unknown,
    args: {
      course_id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      duration: number;
      questions: Array<{ text: string; type: string; order_index: number }>;
    },
  ) => {
    const { questions, ...examPayload } = args;

    const { data: exam, error: examError } = await supabase
      .from("exams")
      .insert([examPayload])
      .select()
      .single();

    if (examError) throw new Error(examError.message);

    const questionRows = questions.map((q) => ({
      exam_id: exam.id,
      text: q.text,
      type: q.type,
      order_index: q.order_index,
    }));

    const { error: qError } = await supabase
      .from("questions")
      .insert(questionRows);
    if (qError) throw new Error(qError.message);

    return exam;
  },
};
