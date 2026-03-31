import { pickDefined } from "@/graphql/shared";
import { supabase } from "@/lib/supabase";

type CreateQuestionArgs = {
  text: string;
  type: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  image_url?: string;
};

export const questionMutations = {
  createQuestion: async (_: unknown, args: CreateQuestionArgs) => {
    const { data, error } = await supabase
      .from("questions")
      .insert([
        {
          text: args.text, // Frontend-ийн content-ийг DB-ийн text-рүү
          image_url: args.image_url, // image_url-ийг шууд
          type: args.type || "multiple_choice",
          difficulty: args.difficulty,
          category: args.category,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log("createQuestion error:", error);
      throw new Error(error.message);
    }
    return data;
  },

  updateQuestion: async (
    _: unknown,
    args: {
      id: string;
      text?: string;
      type?: string;
      difficulty?: string;
      category?: string;
      image_url?: string;
    },
  ) => {
    const payload = pickDefined({
      text: args.text,
      type: args.type,
      difficulty: args.difficulty,
      category: args.category,
      image_url: args.image_url,
    });

    const { data, error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", args.id)
      .select()
      .single();

    if (error) {
      console.log("updateQuestion error:", error);
      throw new Error(error.message);
    }
    return data;
  },

  deleteQuestion: async (_: unknown, args: { id: string }) => {
    // Remove junction rows
    const { error: jErr } = await supabase
      .from("exam_questions")
      .delete()
      .eq("question_id", args.id);
    if (jErr) throw new Error(jErr.message);

    const { error: aErr } = await supabase
      .from("answers")
      .delete()
      .eq("question_id", args.id);
    if (aErr) throw new Error(aErr.message);

    const { error: qErr } = await supabase
      .from("questions")
      .delete()
      .eq("id", args.id);
    if (qErr) throw new Error(qErr.message);

    return true;
  },
};
