import { supabase } from "@/lib/supabase";

type CreateAnswerArgs = {
  question_id: string;
  text: string;
  is_correct: boolean;
};

export const answerMutations = {
  createAnswer: async (_: unknown, args: CreateAnswerArgs) => {
    const { data, error } = await supabase
      .from("answers")
      .insert([args])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
