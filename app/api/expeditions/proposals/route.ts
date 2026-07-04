import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimit } from "@/lib/ratelimit";
import { sendAdminProposalEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!await rateLimit(`proposal:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await cookies();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  if (!profile?.username) return NextResponse.json({ error: "Set a username first" }, { status: 400 });

  const { name, location, difficulty, activity_category, price, date_start, date_end, quota_max, description, image_url, requires_approval } = await req.json();

  if (!name || !location || !difficulty || !price || !date_start || !date_end || !quota_max) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  const { error } = await supabase.from("expedition_proposals").insert({
    proposer_id: user.id,
    proposer_handle: profile.username,
    name: name.trim(),
    location: location.trim(),
    difficulty,
    activity_category: activity_category ?? null,
    price: price.trim(),
    date_start,
    date_end,
    quota_max: Number(quota_max),
    description: description?.trim() || null,
    image_url: image_url?.trim() || null,
    requires_approval: requires_approval ?? false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify all admins
  const service = createServiceClient();
  const { data: admins } = await service.from("profiles").select("id, email").eq("is_admin", true);
  if (admins?.length) {
    const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[];
    sendAdminProposalEmail(adminEmails, profile.username, name.trim()).catch(() => {});
    await service.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        type: "join",
        title: `New trip proposal from @${profile.username}`,
        body: name.trim(),
        link: "/admin",
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
