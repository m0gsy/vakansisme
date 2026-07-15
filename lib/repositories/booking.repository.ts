import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, CreateBookingInput, BookingStatus } from "@/types/booking";

export class BookingRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Booking | null> {
    const { data } = await this.supabase
      .from("expedition_members")
      .select("*, expedition:expeditions(*, profiles!leader_id(username, avatar_url))")
      .eq("id", id)
      .single();
    return data as Booking | null;
  }

  async findByBookingNumber(number: string): Promise<Booking | null> {
    const { data } = await this.supabase
      .from("expedition_members")
      .select("*, expedition:expeditions(*, profiles!leader_id(username, avatar_url))")
      .eq("booking_number", number)
      .single();
    return data as Booking | null;
  }

  async findByUser(userId: string): Promise<Booking[]> {
    const { data } = await this.supabase
      .from("expedition_members")
      .select("*, expedition:expeditions(*, profiles!leader_id(username, avatar_url))")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });
    return (data ?? []) as Booking[];
  }

  async findByExpedition(expeditionId: string): Promise<Booking[]> {
    const { data } = await this.supabase
      .from("expedition_members")
      .select("*, expedition:expeditions(*, profiles!leader_id(username, avatar_url))")
      .eq("expedition_id", expeditionId)
      .order("joined_at", { ascending: false });
    return (data ?? []) as Booking[];
  }

  async create(input: CreateBookingInput): Promise<Booking | null> {
    const { data, error } = await this.supabase
      .from("expedition_members")
      .insert({
        expedition_id: input.expedition_id,
        user_id: input.user_id,
        status: "pending",
        booking_status: "draft",
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Booking | null;
  }

  async updateStatus(id: string, status: BookingStatus, extra?: Record<string, unknown>): Promise<void> {
    const memberStatusMap: Record<string, string> = {
      draft: "pending",
      waiting_payment: "pending_payment",
      confirmed: "approved",
      checked_in: "checked_in",
      completed: "approved",
      cancelled: "rejected",
      expired: "rejected",
      rejected: "rejected",
    };

    const update: Record<string, unknown> = {
      booking_status: status,
      status: memberStatusMap[status] ?? "pending",
    };

    if (status === "cancelled" || status === "expired") {
      update.cancelled_at = new Date().toISOString();
    }
    if (status === "checked_in") {
      update.checked_in_at = new Date().toISOString();
    }

    if (extra) Object.assign(update, extra);

    const { error } = await this.supabase
      .from("expedition_members")
      .update(update)
      .eq("id", id);

    if (error) throw error;
  }

  async setExpiresAt(id: string, expiresAt: string): Promise<void> {
    await this.supabase
      .from("expedition_members")
      .update({ expires_at: expiresAt, payment_due_at: expiresAt })
      .eq("id", id);
  }

  async cancelExpired(): Promise<{ id: string; userId: string; expeditionId: string }[]> {
    const now = new Date().toISOString();
    const serviceClient = this.supabase;
    const { data } = await serviceClient
      .from("expedition_members")
      .select("id, user_id, expedition_id")
      .in("booking_status", ["waiting_payment", "draft"])
      .lt("expires_at", now);

    if (!data?.length) return [];

    for (const row of data) {
      await serviceClient
        .from("expedition_members")
        .update({ booking_status: "expired", status: "rejected", cancelled_at: now, cancel_reason: "Payment deadline passed" })
        .eq("id", row.id)
        .in("booking_status", ["waiting_payment", "draft"]);
    }

    return data.map((r) => ({ id: r.id, userId: r.user_id, expeditionId: r.expedition_id }));
  }

  async countActiveBookings(expeditionId: string): Promise<number> {
    const { count } = await this.supabase
      .from("expedition_members")
      .select("*", { count: "exact", head: true })
      .eq("expedition_id", expeditionId)
      .in("booking_status", ["waiting_payment", "confirmed"]);
    return count ?? 0;
  }

  async getExpedition(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await this.supabase
      .from("expeditions")
      .select("*")
      .eq("id", id)
      .single();
    return data as Record<string, unknown> | null;
  }
}
