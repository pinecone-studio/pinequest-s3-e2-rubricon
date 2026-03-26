import { supabase } from "@/lib/supabase";

export const enrollmentQueries = {
  enrollments: async () => {
    const { data, error } = await supabase.from("enrollments").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  enrollment: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
