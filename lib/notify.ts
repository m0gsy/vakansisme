import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

type NotifType = "join" | "story_approved" | "story_rejected" | "new_follower" | "leader_update" | "gallery_approved" | "gallery_rejected" | "dm" | "proposal_approved" | "proposal_rejected";

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
  body?: string;
  link?: string;
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, link });
  sendPushToUser(userId, { title, body, url: link }).catch(() => {});
}
