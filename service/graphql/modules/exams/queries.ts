import { supabase } from "@/lib/supabase";

export const examQueries = {
  exams: async () => {
    const { data, error } = await supabase.from("exams").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  exam: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
