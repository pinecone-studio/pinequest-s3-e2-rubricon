import { supabase } from "@/lib/supabase";

export const studentQueries = {
  students: async () => {
    const { data, error } = await supabase.from("students").select("*");
    if (error) throw new Error(error.message);
    return data;
  },

  student: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", args.id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
