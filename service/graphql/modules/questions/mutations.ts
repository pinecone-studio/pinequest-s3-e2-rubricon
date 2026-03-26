import { supabase } from "@/lib/supabase";

type CreateQuestionArgs = {
  exam_id: string;
  text: string;
  type: string;
  order_index: number;
};

export const questionMutations = {
  createQuestion: async (_: unknown, args: CreateQuestionArgs) => {
    const { data, error } = await supabase
      .from("questions")
      .insert([args])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
