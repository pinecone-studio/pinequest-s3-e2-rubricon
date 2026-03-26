import { supabase } from "@/lib/supabase";

export const studentMutations = {
  createStudent: async (_: unknown, args: { name: string; email: string }) => {
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name: args.name,
          email: args.email,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
