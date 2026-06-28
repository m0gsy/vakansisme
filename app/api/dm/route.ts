import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/dm — list recent conversations (one row per conversation partner)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // Get latest message per conversation partner
  const { data } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, read, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return NextResponse.json([]);

  // Deduplicate: one entry per partner, latest message
  const seen = new Map<string, typeof data[0]>();
  for (const msg of data) {
    const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (!seen.has(partnerId)) seen.set(partnerId, msg);
  }

  const partnerIds = [...seen.keys()];
  if (!partnerIds.length) return NextResponse.json([]);

  // Fetch profiles for all partners
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", partnerIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Count unread per partner
  const { data: unreadRows } = await supabase
    .from("direct_messages")
    .select("sender_id")
    .eq("recipient_id", user.id)
    .eq("read", false);
  const unreadCounts = new Map<string, number>();
  for (const r of unreadRows ?? []) {
    unreadCounts.set(r.sender_id, (unreadCounts.get(r.sender_id) ?? 0) + 1);
  }

  const conversations = partnerIds.map((partnerId) => {
    const msg = seen.get(partnerId)!;
    const profile = profileMap.get(partnerId);
    return {
      partnerId,
      username: profile?.username ?? "Unknown",
      avatar_url: profile?.avatar_url ?? null,
      lastMessage: msg.body,
      lastAt: msg.created_at,
      unread: unreadCounts.get(partnerId) ?? 0,
    };
  }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return NextResponse.json(conversations);
}
