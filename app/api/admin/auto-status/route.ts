import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date().toISOString();

  const [{ data: ongoingRows }, { data: completedRows }] = await Promise.all([
    supabase
      .from("expeditions")
      .update({ status: "ongoing" })
      .lt("date_start", now)
      .gt("date_end", now)
      .eq("status", "upcoming")
      .select("id"),
    supabase
      .from("expeditions")
      .update({ status: "completed" })
      .lt("date_end", now)
      .in("status", ["upcoming", "ongoing"])
      .select("id"),
  ]);

  return NextResponse.json({ updated: { ongoing: ongoingRows?.length ?? 0, completed: completedRows?.length ?? 0 } });
}
