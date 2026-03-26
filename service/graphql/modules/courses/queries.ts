import { supabase } from "@/lib/supabase";

export const courseQueries = {
  courses: async () => {
    const { data, error } = await supabase.from("courses").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  course: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  courseByCode: async (_: unknown, args: { code: string }) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("code", args.code)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
