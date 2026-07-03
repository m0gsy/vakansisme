import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { createNotification } from "@/lib/notify";

type Params = Promise<{ userId: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { userId: partnerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, body, read, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(100);

  // Mark incoming as read — only if there are unread messages to update
  const hasUnread = messages?.some((m) => m.sender_id === partnerId && !m.read);
  if (hasUnread) {
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("recipient_id", user.id)
      .eq("read", false);
  }

  return NextResponse.json(messages ?? []);
}

export async function POST(req: Request, { params }: { params: Params }) {
  const { userId: recipientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  if (recipientId === user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!await rateLimit(`dm:${user.id}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many messages" }, { status: 429 });
  }

  const { body } = await req.json() as { body: string };
  if (!body?.trim() || body.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, body: body.trim() })
    .select("id, sender_id, body, read, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 });

  // Notify recipient
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  createNotification({
    userId: recipientId,
    type: "dm",
    title: `New message from @${senderProfile?.username ?? "someone"}`,
    body: body.trim().slice(0, 80),
    link: `/messages/${senderProfile?.username}`,
  }).catch(() => {});

  return NextResponse.json(message, { status: 201 });
}
