import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";

const VALID_TYPES = ["photo dump", "short story", "video POV", "chaos moment"];
const MAX_CONTENT_LENGTH = 50000;

export async function POST(req: Request) {
  const { type, title, excerpt, content, image_url, audio_url, expedition_id, series_id, series_order, tags, submit } = await req.json();

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (content && content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Content too long (max ${MAX_CONTENT_LENGTH} chars)` }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!await rateLimit(`story:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("username, is_banned").eq("id", user.id).single();
  if (profile?.is_banned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  const author_handle = profile?.username ? `@${profile.username}` : `@${user.email?.split("@")[0] ?? "anon"}`;

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      author_handle,
      type,
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      content: content?.trim() || null,
      image_url: image_url?.trim() || null,
      audio_url: audio_url?.trim() || null,
      expedition_id: expedition_id || null,
      series_id: series_id || null,
      series_order: series_id && series_order ? Number(series_order) : 0,
      tags: Array.isArray(tags) ? tags.slice(0, 5).map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [],
      published: false,
      status: submit === true ? "pending" : "draft",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create story" }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
