import type { SupabaseClient } from "@supabase/supabase-js";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import type { Booking, BookingStatus, CreateBookingInput } from "@/types/booking";

export class BookingService {
  constructor(
    private supabase: SupabaseClient,
    private serviceSupabase?: SupabaseClient
  ) {}

  private get bookingRepo() {
    return new BookingRepository(this.supabase);
  }

  private get auditRepo() {
    return new AuditRepository(this.serviceSupabase ?? this.supabase);
  }

  async createBooking(input: CreateBookingInput, ip?: string): Promise<{ booking: Booking | null; memberStatus: string }> {
    const expedition = await this.bookingRepo.getExpedition(input.expedition_id);
    if (!expedition) throw new Error("Expedition not found");

    if (expedition.status === "completed" || expedition.status === "cancelled") {
      throw new Error("Expedition is no longer open for registration");
    }

    const activeCount = await this.bookingRepo.countActiveBookings(input.expedition_id);
    if (activeCount >= (expedition.quota_max as number)) {
      throw new Error("Trip is full");
    }

    const booking = await this.bookingRepo.create(input);
    if (!booking) throw new Error("Failed to create booking");

    const paymentPolicy = (expedition.payment_policy as string) ?? "free";
    const requiresApproval = (expedition.requires_approval as boolean) ?? false;
    const priceAmount = (expedition.price_amount as number) ?? 0;
    const isPaid = paymentPolicy !== "free" && priceAmount > 0;

    let memberStatus = "pending";
    let bookingStatus: BookingStatus = "draft";

    if (isPaid) {
      bookingStatus = "waiting_payment";
      memberStatus = "pending_payment";
      const expiresAt = this.calculateExpiresAt(expedition);
      await this.bookingRepo.setExpiresAt(booking.id, expiresAt);
    } else if (requiresApproval) {
      bookingStatus = "draft";
    } else {
      bookingStatus = "confirmed";
      memberStatus = "approved";
    }

    await this.bookingRepo.updateStatus(booking.id, bookingStatus);

    await this.auditRepo.log("booking.created", {
      bookingId: booking.id,
      actorId: input.user_id,
      actorIp: ip ?? null,
      description: `Booking created for expedition ${expedition.name as string}`,
      metadata: { expedition_id: input.expedition_id, policy: paymentPolicy },
    });

    return { booking: await this.bookingRepo.findById(booking.id), memberStatus };
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string, ip?: string): Promise<void> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.user_id !== userId) throw new Error("Unauthorized");

    if (["completed", "checked_in"].includes(booking.booking_status)) {
      throw new Error("Cannot cancel a completed or checked-in booking");
    }

    const expedition = booking.expedition;
    if (expedition && (expedition.status === "ongoing" || expedition.status === "completed")) {
      throw new Error("Cannot cancel a trip that is currently ongoing or completed");
    }

    await this.bookingRepo.updateStatus(bookingId, "cancelled", {
      cancel_reason: reason ?? null,
    });

    await this.auditRepo.log("booking.cancelled", {
      bookingId,
      actorId: userId,
      actorIp: ip ?? null,
      description: reason ? `Booking cancelled: ${reason}` : "Booking cancelled by user",
    });
  }

  async confirmBooking(bookingId: string): Promise<void> {
    await this.bookingRepo.updateStatus(bookingId, "confirmed");
  }

  async expireBooking(bookingId: string, reason?: string): Promise<void> {
    await this.bookingRepo.updateStatus(bookingId, "expired", {
      cancel_reason: reason ?? "Payment deadline passed",
    });
  }

  async completeCheckIn(bookingId: string): Promise<void> {
    await this.bookingRepo.updateStatus(bookingId, "checked_in");
  }

  async completeTrip(bookingId: string): Promise<void> {
    await this.bookingRepo.updateStatus(bookingId, "completed");
  }

  async getBookingTimeline(bookingId: string) {
    return this.auditRepo.findByBooking(bookingId);
  }

  private calculateExpiresAt(expedition: Record<string, unknown>): string {
    const policy = (expedition.payment_deadline_policy as string) ?? "hours";
    const value = (expedition.payment_deadline_value as number) ?? 24;
    const specificDate = expedition.payment_deadline_date as string | null;
    const now = Date.now();

    switch (policy) {
      case "no_deadline":
        return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      case "hours":
        return new Date(now + value * 60 * 60 * 1000).toISOString();
      case "days":
        return new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
      case "specific_date":
        return specificDate ?? new Date(now + 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now + 24 * 60 * 60 * 1000).toISOString();
    }
  }
}
