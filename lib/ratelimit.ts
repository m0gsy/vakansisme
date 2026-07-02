import { createServiceClient } from "@/lib/supabase/service";

export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    // Service client bypasses RLS — rate_limits is server-internal, not user data
    const supabase = createServiceClient();
    const windowStart = new Date(Date.now() - windowMs).toISOString();

    const { data } = await supabase
      .from("rate_limits")
      .select("count, window_start")
      .eq("key", key)
      .maybeSingle();

    if (!data || data.window_start < windowStart) {
      await supabase
        .from("rate_limits")
        .upsert({ key, count: 1, window_start: new Date().toISOString() }, { onConflict: "key" });
      return true;
    }

    if (data.count >= max) return false;

    await supabase.from("rate_limits").update({ count: data.count + 1 }).eq("key", key);
    return true;
  } catch {
    return false; // fail closed — no DB = deny request
  }
}
