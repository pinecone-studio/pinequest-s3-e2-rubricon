import { supabase } from "@/lib/supabase";

type CreateSubmissionArgs = {
  student_id: string;
  exam_id: string;
  started_at: string;
  submitted_at?: string;
  score?: number;
};

export const submissionMutations = {
  createSubmission: async (_: unknown, args: CreateSubmissionArgs) => {
    const { data, error } = await supabase
      .from("submissions")
      .insert([args])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
