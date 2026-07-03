import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: story } = await supabase.from("stories").select("id").eq("id", id).eq("published", true).maybeSingle();
  if (!story) return NextResponse.json({ ok: true }); // silent — don't reveal unpublished existence
  await supabase.rpc("increment_story_views", { story_id: id });
  return NextResponse.json({ ok: true });
}
