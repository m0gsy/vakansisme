import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { following_id } = await req.json();
  if (!following_id) {
    return NextResponse.json({ error: "following_id required" }, { status: 400 });
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

  // Rate limit: max 60 new follows per hour (blocks mass-follow scripts)
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 60) {
    return NextResponse.json({ error: "Too many follows. Try again later." }, { status: 429 });
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already following" }, { status: 409 });
    if (error.code === "23503") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to follow" }, { status: 400 });
  }

  // In-app notification (fire-and-forget)
  supabase.from("profiles").select("username").eq("id", user.id).single().then(({ data: followerProfile }) => {
    void supabase.from("notifications").insert({
      user_id: following_id,
      type: "new_follower",
      title: `@${followerProfile?.username ?? "someone"} followed you`,
      link: `/u/${followerProfile?.username ?? ""}`,
    });
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { following_id } = await req.json();

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

  await supabase
    .from("follows")
    .delete()
    .match({ follower_id: user.id, following_id });

  return NextResponse.json({ success: true });
}
