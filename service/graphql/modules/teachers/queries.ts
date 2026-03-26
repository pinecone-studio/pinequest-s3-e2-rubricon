import { supabase } from "@/lib/supabase";

export const teacherQueries = {
  teachers: async () => {
    const { data, error } = await supabase.from("teacher").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  teacher: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("teacher")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
