import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction, AuditLog } from "@/types/audit";

export class AuditRepository {
  constructor(private supabase: SupabaseClient) {}

  async log(action: AuditAction, params: {
    bookingId: string;
    paymentId?: string | null;
    actorId?: string | null;
    actorIp?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.supabase.from("booking_audit_logs").insert({
      booking_id: params.bookingId,
      payment_id: params.paymentId ?? null,
      action,
      actor_id: params.actorId ?? null,
      actor_ip: params.actorIp ?? null,
      description: params.description ?? null,
      metadata: params.metadata ?? {},
    });
  }

  async findByBooking(bookingId: string): Promise<AuditLog[]> {
    const { data } = await this.supabase
      .from("booking_audit_logs")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    return (data ?? []) as AuditLog[];
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    const { data } = await this.supabase
      .from("booking_audit_logs")
      .select("*")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as AuditLog[];
  }

  async getRecent(limit = 100): Promise<AuditLog[]> {
    const { data } = await this.supabase
      .from("booking_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as AuditLog[];
  }
}
