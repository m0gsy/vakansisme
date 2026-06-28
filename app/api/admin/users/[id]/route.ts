import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = await getAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await req.json();

  if (!["ban", "unban", "promote", "demote"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if ((action === "promote" || action === "demote") && admin.id === id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const update =
    action === "ban"     ? { is_banned: true } :
    action === "unban"   ? { is_banned: false } :
    action === "promote" ? { is_admin: true } :
                           { is_admin: false };

  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
