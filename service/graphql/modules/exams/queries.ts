import { supabase } from "@/lib/supabase";
import { redis } from "@/lib/redis";

export const examQueries = {
  exams: async () => {
    console.log("🔴 exams resolver called"); // ← ЭНД НЭМ
    const cached = await redis.get("exams");
    console.log("🔴 cached:", cached); // ← ЭНД НЭМ
    if (cached) return cached;

    const { data, error } = await supabase.from("exams").select("*");
    if (error) throw new Error(error.message);

    await redis.set("exams", data, { ex: 300 });
    return data;
  },

  exam: async (_: unknown, args: { id: string }) => {
    console.log("🔴 exam resolver called, id:", args.id); // ← ЭНД НЭМ
    const cacheKey = `exam:${args.id}`;

    const cached = await redis.get(cacheKey); // ← ЭНИЙГ ЗАСАВ: "exams" биш cacheKey байх ёстой
    if (cached) {
      console.log("✓ Cache hit:", cacheKey);
      return cached;
    }
    console.log("✗ Cache miss:", cacheKey);

    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", args.id)
      .single();
    if (error) throw new Error(error.message);

    await redis.set(cacheKey, data, { ex: 300 });
    return data;
  },
};
