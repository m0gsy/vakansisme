import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/seo";

type Params = Promise<{ id: string }>;
const SELECT = "id, kind, name, slug, parent_id, location_id, elevation_m, description, image_url";

async function isValidKind(supabase: Awaited<ReturnType<typeof createClient>>, kind: unknown) {
  if (typeof kind !== "string") return false;
  const { data } = await supabase.from("destination_kinds").select("name").eq("name", kind).maybeSingle();
  return !!data;
}

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
  if (body.kind !== undefined) {
    if (!await isValidKind(supabase, body.kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    update.kind = body.kind;
  }
  if (body.parent_id !== undefined) update.parent_id = body.parent_id || null;
  if (body.location_id !== undefined) update.location_id = body.location_id || null;
  if (body.elevation_m !== undefined) update.elevation_m = body.elevation_m !== null && body.elevation_m !== "" ? Number(body.elevation_m) : null;
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.image_url !== undefined) update.image_url = body.image_url?.trim() || null;
  if (body.slug !== undefined) {
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug || slugify(slug) !== slug) return NextResponse.json({ error: "Slug must be lowercase, alphanumeric, hyphen-separated" }, { status: 400 });
    update.slug = slug;
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  if (body.parent_id !== undefined && body.parent_id) {
    let kindToCheck = body.kind;
    if (kindToCheck === undefined) {
      const { data: current } = await supabase.from("destinations").select("kind").eq("id", id).maybeSingle();
      kindToCheck = current?.kind;
    }
    if (kindToCheck === "trail") {
      const { data: parent } = await supabase.from("destinations").select("kind").eq("id", body.parent_id).maybeSingle();
      if (parent?.kind !== "mountain") {
        return NextResponse.json({ error: "Trail's parent must be a mountain" }, { status: 400 });
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("destinations")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A destination with this name or slug already exists" }, { status: 409 });
    if (error.code === "23503") return NextResponse.json({ error: "Invalid parent or location reference" }, { status: 400 });
    if (error.code === "23514") return NextResponse.json({ error: "Violates hierarchy rules (trail needs mountain parent, city needs province)" }, { status: 400 });
    if (error.code === "PGRST116") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ destination: updated });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!await getAdmin(supabase)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: dest } = await supabase.from("destinations").select("id").eq("id", id).single();
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ count: expCount }, { count: storyCount }, { count: childCount }] = await Promise.all([
    supabase.from("expeditions").select("*", { count: "exact", head: true }).eq("destination_id", id),
    supabase.from("stories").select("*", { count: "exact", head: true }).eq("destination_id", id),
    supabase.from("destinations").select("*", { count: "exact", head: true }).eq("parent_id", id),
  ]);

  if ((expCount ?? 0) > 0 || (storyCount ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${(expCount ?? 0) + (storyCount ?? 0)} expedition/story reference(s) use this destination` }, { status: 409 });
  }
  if ((childCount ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete: ${childCount} child trail(s) reference this destination` }, { status: 409 });
  }

  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return NextResponse.json({ error: "Cannot delete: destination is still referenced" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
