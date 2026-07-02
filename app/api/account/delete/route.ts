import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  // 3 attempts per hour per user — prevents brute-force confirm-string guessing
  if (!await rateLimit(`account-delete:${user.id}`, 3, 3_600_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { confirm } = await req.json();
  if (confirm !== "DELETE") return NextResponse.json({ error: 'Send { confirm: "DELETE" } to confirm' }, { status: 400 });

  // Use service role to delete auth user (cascades to profiles + all related data via FK)
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
