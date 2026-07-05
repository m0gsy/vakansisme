import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ name: string }>;

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { name } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count } = await supabase
    .from("destinations")
    .select("*", { count: "exact", head: true })
    .eq("kind", name);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${count} destination(s) use this kind` }, { status: 409 });
  }

  const { error } = await supabase.from("destination_kinds").delete().eq("name", name);
  if (error) {
    if (error.code === "23503") return NextResponse.json({ error: "Cannot delete: kind is still referenced" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
