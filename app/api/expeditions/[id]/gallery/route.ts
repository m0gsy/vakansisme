import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

function makeClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { image_url, caption } = await req.json();
  if (!image_url) return NextResponse.json({ error: "image_url required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { data, error } = await supabase
    .from("expedition_gallery")
    .insert({
      expedition_id: id,
      uploader_id: user.id,
      uploader_handle: profile.username,
      image_url,
      caption: caption?.trim() || null,
    })
    .select("id, uploader_id, uploader_handle, image_url, caption, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const { id: expeditionId } = await params;
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { photoId } = await req.json();
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const { error } = await supabase
    .from("expedition_gallery")
    .delete()
    .eq("id", photoId)
    .eq("expedition_id", expeditionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
