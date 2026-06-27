import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ROTATIONS = [-3.2, -2.4, -1.0, -0.7, 1.8, 2.5, 3.2];
const COLORS = ["#9BFF3C", "#FF6B1A"];

export async function POST(req: Request) {
  const { type, caption } = await req.json();

  if (!type || !caption?.trim()) {
    return NextResponse.json({ error: "type and caption required" }, { status: 400 });
  }
  if (caption.length > 280) {
    return NextResponse.json({ error: "Caption max 280 chars" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const author_handle = profile?.username
    ? `@${profile.username}`
    : user.email?.split("@")[0] ?? "anonymous";

  // Rate limit: 5 submissions per hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentCount } = await supabase
    .from("chaos_submissions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json({ error: "Too many submissions. Try again in an hour." }, { status: 429 });
  }

  const rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
  const accent_color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const { data, error } = await supabase
    .from("chaos_submissions")
    .insert({ author_id: user.id, author_handle, type, caption, rotation, accent_color })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, card: data });
}
