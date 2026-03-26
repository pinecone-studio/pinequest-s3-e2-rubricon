import { supabase } from "@/lib/supabase";

export const submissionQueries = {
  submissions: async () => {
    const { data, error } = await supabase.from("submissions").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  submission: async (_: unknown, args: { id: string }) => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
