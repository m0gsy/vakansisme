import { createServiceClient } from "@/lib/supabase/service";
import { sendPushToUser } from "@/lib/push";

type NotifType =
  | "join"
  | "story_approved"
  | "story_rejected"
  | "new_follower"
  | "leader_update"
  | "gallery_approved"
  | "gallery_rejected"
  | "dm"
  | "proposal_approved"
  | "proposal_rejected"
  | "story_like"
  | "story_comment"
  | "join_approved"
  | "join_rejected"
  | "payment_refunded"
  | "waitlist_spot";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotifType;
  title: string;
  body?: string | null;
  link?: string | null;
}) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, link });
  sendPushToUser(userId, { title, body: body ?? undefined, url: link ?? undefined }).catch(() => {});
}
