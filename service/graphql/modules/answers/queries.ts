import { supabase } from "@/lib/supabase";

export const answerQueries = {
  answers: async () => {
    const { data, error } = await supabase.from("answers").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  answer: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("answers")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
