import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", db: "ok", latency_ms: Date.now() - start });
  } catch {
    return NextResponse.json({ status: "error", db: "unreachable", latency_ms: Date.now() - start }, { status: 503 });
  }
}
