import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("expedition_packing_items")
    .select("id, label, category, quantity, created_at")
    .eq("expedition_id", id)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  if (!items) return NextResponse.json([]);

  // Fetch user's checks if logged in
  if (user) {
    const { data: checks } = await supabase
      .from("packing_checks")
      .select("item_id")
      .eq("user_id", user.id)
      .in("item_id", items.map((i) => i.id));

    const checkedSet = new Set(checks?.map((c) => c.item_id) ?? []);
    return NextResponse.json(items.map((i) => ({ ...i, checked: checkedSet.has(i.id) })));
  }

  return NextResponse.json(items.map((i) => ({ ...i, checked: false })));
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Only leader or admin can add packing items
  const [{ data: expedition }, { data: profile }] = await Promise.all([
    supabase.from("expeditions").select("leader_id").eq("id", id).single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (expedition?.leader_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const label = body.label?.trim();
  const category = body.category?.trim() || "general";
  const quantity = Number(body.quantity) || 1;

  if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });

  const { data, error } = await supabase
    .from("expedition_packing_items")
    .insert({ expedition_id: id, label, category, quantity })
    .select("id, label, category, quantity, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ...data, checked: false });
}

// PATCH — toggle personal check-off
export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { itemId, checked } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  // Validate itemId belongs to this expedition
  const { data: item } = await supabase.from("expedition_packing_items").select("id").eq("id", itemId).eq("expedition_id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (checked) {
    await supabase.from("packing_checks").upsert({ item_id: itemId, user_id: user.id }, { onConflict: "item_id,user_id" });
  } else {
    await supabase.from("packing_checks").delete().eq("item_id", itemId).eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Only leader or admin can delete packing items
  const [{ data: expedition }, { data: profile }] = await Promise.all([
    supabase.from("expeditions").select("leader_id").eq("id", id).single(),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (expedition?.leader_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { itemId } = await req.json();
  await supabase.from("expedition_packing_items").delete().eq("id", itemId).eq("expedition_id", id);
  return NextResponse.json({ success: true });
}
