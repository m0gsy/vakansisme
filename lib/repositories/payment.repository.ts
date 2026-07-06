import type { SupabaseClient } from "@supabase/supabase-js";
import type { Payment, PaymentStatus, CreatePaymentInput } from "@/types/payment";
import type { BankAccount, QrisAccount, PaymentSettings } from "@/types/payment";

export class PaymentRepository {
  constructor(private supabase: SupabaseClient, private serviceSupabase?: SupabaseClient) {}

  private get db() {
    return this.serviceSupabase ?? this.supabase;
  }

  async findById(id: string): Promise<Payment | null> {
    const { data } = await this.supabase
      .from("expedition_payments")
      .select("*")
      .eq("id", id)
      .single();
    return data as Payment | null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const { data } = await this.supabase
      .from("expedition_payments")
      .select("*")
      .eq("payment_order_id", orderId)
      .maybeSingle();
    return data as Payment | null;
  }

  async findByBooking(bookingId: string): Promise<Payment[]> {
    const { data } = await this.supabase
      .from("expedition_payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Payment[];
  }

  async findByUser(userId: string): Promise<Payment[]> {
    const { data } = await this.supabase
      .from("expedition_payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Payment[];
  }

  async create(input: CreatePaymentInput): Promise<Payment | null> {
    const orderId = `PAY-${input.expedition_id.slice(0, 8)}-${input.user_id.slice(0, 8)}-${Date.now()}`;

    const { data, error } = await this.supabase
      .from("expedition_payments")
      .insert({
        user_id: input.user_id,
        expedition_id: input.expedition_id,
        booking_id: input.booking_id,
        payment_order_id: orderId,
        amount_idr: input.amount_idr,
        provider: input.provider,
        status: "pending",
        payment_status: "pending",
        payment_method: input.payment_method,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Payment | null;
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, extra?: Record<string, unknown>): Promise<void> {
    const update: Record<string, unknown> = {
      payment_status: status,
      status: status === "paid" ? "paid" : status === "refunded" ? "refunded" : status === "cancelled" ? "cancelled" : "pending",
    };

    if (status === "paid") {
      update.verified_at = new Date().toISOString();
    }
    if (status === "rejected" && extra?.reason) {
      update.rejected_reason = extra.reason;
    }
    if (status === "refunded") {
      update.refunded_at = new Date().toISOString();
      if (extra?.reason) update.refund_reason = extra.reason;
    }

    if (extra) {
      if (extra.verified_by) update.verified_by = extra.verified_by;
      Object.assign(update, extra);
    }

    const { error } = await this.db.from("expedition_payments").update(update).eq("id", id);
    if (error) throw error;
  }

  async uploadProof(id: string, imageUrl: string): Promise<void> {
    const { error } = await this.supabase
      .from("expedition_payments")
      .update({
        proof_image_url: imageUrl,
        proof_uploaded_at: new Date().toISOString(),
        payment_status: "waiting_verification",
        status: "pending",
      })
      .eq("id", id);

    if (error) throw error;
  }

  async getActiveBankAccounts(): Promise<BankAccount[]> {
    const { data } = await this.supabase
      .from("bank_accounts")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return (data ?? []) as BankAccount[];
  }

  async getExpeditionBankAccounts(expeditionId: string): Promise<BankAccount[]> {
    const { data } = await this.supabase
      .from("expedition_bank_accounts")
      .select("bank_accounts(*)")
      .eq("expedition_id", expeditionId);
    return ((data ?? []).map((r: unknown) => {
      const row = r as { bank_accounts: unknown };
      return row.bank_accounts;
    }).filter(Boolean)) as BankAccount[];
  }

  async getActiveQrisAccounts(): Promise<QrisAccount[]> {
    const { data } = await this.supabase
      .from("qris_accounts")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return (data ?? []) as QrisAccount[];
  }

  async getSettings(): Promise<PaymentSettings | null> {
    const { data: rows } = await this.supabase
      .from("payment_settings")
      .select("key, value");

    if (!rows) return null;

    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings as unknown as PaymentSettings;
  }

  async getEnabledProviders(): Promise<{ name: string; display_name: string }[]> {
    const { data } = await this.supabase
      .from("payment_providers")
      .select("name, display_name")
      .eq("enabled", true);
    return (data ?? []) as { name: string; display_name: string }[];
  }

  async getVerificationQueue(): Promise<Payment[]> {
    const { data } = await this.db
      .from("expedition_payments")
      .select("*, expedition:expeditions(name, slug), profile:profiles!inner(username)")
      .eq("payment_status", "waiting_verification")
      .order("proof_uploaded_at", { ascending: true });
    return (data ?? []) as Payment[];
  }
}
