import { supabase } from "@/lib/supabase";

type CreateSubmissionAnswerArgs = {
  submission_id: string;
  question_id: string;
  answer_id?: string;
  text_answer?: string;
};

export const submissionAnswerMutations = {
  createSubmissionAnswer: async (
    _: unknown,
    args: CreateSubmissionAnswerArgs,
  ) => {
    const { data, error } = await supabase
      .from("submission_answers")
      .insert([args])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
