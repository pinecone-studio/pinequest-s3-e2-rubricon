import { supabase } from "@/lib/supabase";

export const relationResolvers = {
  Course: {
    exams: async (parent: { id: string }) => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("course_id", parent.id);

      if (error) throw new Error(error.message);
      return data;
    },
  },

  Exam: {
    questions: async (parent: { id: string }) => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", parent.id)
        .order("order_index", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
  },

  Submission: {
    answers: async (parent: { id: string }) => {
      const { data, error } = await supabase
        .from("submission_answers")
        .select("*")
        .eq("submission_id", parent.id);

      if (error) throw new Error(error.message);
      return data;
    },
  },
};
