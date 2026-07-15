import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

export async function sendPushToUser(userId: string, payload: { title: string; body?: string; url?: string }) {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  webpush.setVapidDetails(
    "mailto:admin@vakansisme.club",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  try {
    const supabase = createServiceClient();
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", userId);

    if (!subs?.length) return;

    const notifications = subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify(payload)
        )
        .catch(async (err: { statusCode?: number }) => {
          // Remove stale subscriptions (410 = gone, 404 = not found)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        })
    );
    await Promise.allSettled(notifications);
  } catch {
    // Non-critical — don't crash notification flow
  }
}
