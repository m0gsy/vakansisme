import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("display_order", { ascending: true });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json();
  const { bank_name, account_name, account_number, branch, display_order } = body;

  if (!bank_name || !account_name || !account_number) {
    return NextResponse.json({ error: "bank_name, account_name, account_number required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("bank_accounts").insert({
    bank_name, account_name, account_number,
    branch: branch ?? null,
    display_order: display_order ?? 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
