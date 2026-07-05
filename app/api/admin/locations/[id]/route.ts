import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/seo";

type Params = Promise<{ id: string }>;
const TYPES = ["province", "city"] as const;
const SELECT = "id, type, name, slug, parent_id";

async function getAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return p?.is_admin ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Name must be 2–100 characters" }, { status: 400 });
    update.name = name;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    update.type = body.type;
  }
  if (body.parent_id !== undefined) update.parent_id = body.parent_id || null;
  if (body.slug !== undefined) {
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug || slugify(slug) !== slug) return NextResponse.json({ error: "Slug must be lowercase, alphanumeric, hyphen-separated" }, { status: 400 });
    update.slug = slug;
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  if (body.parent_id !== undefined && body.parent_id) {
    let typeToCheck = body.type;
    if (typeToCheck === undefined) {
      const { data: current } = await supabase.from("locations").select("type").eq("id", id).maybeSingle();
      typeToCheck = current?.type;
    }
    if (typeToCheck === "city") {
      const { data: parent } = await supabase.from("locations").select("type").eq("id", body.parent_id).maybeSingle();
      if (parent?.type !== "province") {
        return NextResponse.json({ error: "City's parent must be a province" }, { status: 400 });
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("locations")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A location with this name or slug already exists" }, { status: 409 });
    if (error.code === "23503") return NextResponse.json({ error: "Invalid parent or location reference" }, { status: 400 });
    if (error.code === "23514") return NextResponse.json({ error: "Violates hierarchy rules (trail needs mountain parent, city needs province)" }, { status: 400 });
    if (error.code === "PGRST116") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ location: updated });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: loc } = await supabase.from("locations").select("id").eq("id", id).single();
  if (!loc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ count: childCount }, { count: destCount }] = await Promise.all([
    supabase.from("locations").select("*", { count: "exact", head: true }).eq("parent_id", id),
    supabase.from("destinations").select("*", { count: "exact", head: true }).eq("location_id", id),
  ]);

  if ((childCount ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${childCount} city/cities reference this province` }, { status: 409 });
  }
  if ((destCount ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${destCount} destination(s) reference this location` }, { status: 409 });
  }

  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return NextResponse.json({ error: "Cannot delete: location is still referenced" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
