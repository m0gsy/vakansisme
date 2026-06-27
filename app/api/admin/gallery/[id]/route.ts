import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendGalleryStatusEmail } from "@/lib/email";

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

  const { status } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: photo } = await supabase
    .from("expedition_gallery")
    .select("uploader_id, uploader_handle, expedition_id, expeditions(name)")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("expedition_gallery").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify uploader
  if (photo?.uploader_id) {
    supabase
      .from("profiles")
      .select("email")
      .eq("id", photo.uploader_id)
      .maybeSingle()
      .then(({ data: profile }) => {
        const tripName = Array.isArray(photo.expeditions) ? photo.expeditions[0]?.name : (photo.expeditions as { name: string } | null)?.name;
        if (profile?.email && tripName) {
          sendGalleryStatusEmail(profile.email, photo.uploader_handle, status as "approved" | "rejected", tripName).catch(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = await getAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("expedition_gallery").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
