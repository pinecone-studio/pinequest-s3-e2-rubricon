import { supabase } from "@/lib/supabase";

export const teacherMutations = {
  createTeacher: async (_: unknown, args: { name: string; email: string }) => {
    const { data, error } = await supabase
      .from("teacher")
      .insert([{ name: args.name, email: args.email }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
