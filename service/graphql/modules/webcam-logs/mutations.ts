import { pickDefined } from "@/graphql/shared";
import { supabase } from "@/lib/supabase";

export const webcamLogMutations = {
  createWebcamLog: async (
    _: unknown,
    args: {
      student_id: string;
      exam_id: string;
      image_url: string;
      metadata?: unknown;
    },
  ) => {
    const payload = {
      student_id: args.student_id,
      exam_id: args.exam_id,
      image_url: args.image_url,
      metadata: args.metadata ?? null,
    };

    const { data, error } = await supabase
      .from("webcam_logs")
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateWebcamLog: async (
    _: unknown,
    args: { id: string; image_url?: string; metadata?: unknown },
  ) => {
    const payload = pickDefined({
      image_url: args.image_url,
      metadata: args.metadata,
    });

    const { data, error } = await supabase
      .from("webcam_logs")
      .update(payload)
      .eq("id", args.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteWebcamLog: async (_: unknown, args: { id: string }) => {
    const { error } = await supabase
      .from("webcam_logs")
      .delete()
      .eq("id", args.id);
    if (error) throw new Error(error.message);
    return true;
  },
};
