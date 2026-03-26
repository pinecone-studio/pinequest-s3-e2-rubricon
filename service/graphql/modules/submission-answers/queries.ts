import { supabase } from "@/lib/supabase";

export const submissionAnswerQueries = {
  submissionAnswers: async () => {
    const { data, error } = await supabase
      .from("submission_answers")
      .select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  submissionAnswer: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("submission_answers")
      .select("*")
      .eq("id", args.id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
