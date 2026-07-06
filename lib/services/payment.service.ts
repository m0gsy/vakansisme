import type { SupabaseClient } from "@supabase/supabase-js";
import { PaymentRepository } from "@/lib/repositories/payment.repository";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { BookingService } from "./booking.service";
import { getProviderForPayment } from "@/lib/payment/provider-registry";
import type { CreatePaymentInput, Payment, PaymentProvider } from "@/types/payment";
import type { ProviderPaymentResult } from "@/lib/payment/providers/types";

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private bookingRepo: BookingRepository;
  private bookingService: BookingService;
  private auditRepo: AuditRepository;

  constructor(
    private supabase: SupabaseClient,
    private serviceSupabase?: SupabaseClient
  ) {
    this.paymentRepo = new PaymentRepository(this.supabase, this.serviceSupabase);
    this.bookingRepo = new BookingRepository(this.supabase);
    this.bookingService = new BookingService(this.supabase, this.serviceSupabase);
    this.auditRepo = new AuditRepository(this.serviceSupabase ?? this.supabase);
  }

  async createPayment(input: Omit<CreatePaymentInput, "provider"> & { provider?: string }): Promise<{ payment: Payment | null; instructions?: ProviderPaymentResult["instructions"] }> {
    const booking = await this.bookingRepo.findById(input.booking_id);
    if (!booking) throw new Error("Booking not found");
    if (booking.booking_status !== "waiting_payment") {
      throw new Error("Booking is not in waiting_payment status");
    }

    const existingPayments = await this.paymentRepo.findByBooking(input.booking_id);
    if (existingPayments.some((p) => p.payment_status === "pending" || p.payment_status === "waiting_verification")) {
      throw new Error("There is already an active payment for this booking");
    }

    const payment = await this.paymentRepo.create({
      ...input,
      provider: (input.provider ?? "manual_transfer") as PaymentProvider,
    });

    if (!payment) throw new Error("Failed to create payment");

    const provider = getProviderForPayment(payment, this.supabase);
    const result = await provider.createPayment({
      paymentId: payment.id,
      orderId: payment.payment_order_id,
      amount: payment.amount_idr,
    });

    await this.auditRepo.log("payment.created", {
      bookingId: input.booking_id,
      paymentId: payment.id,
      actorId: input.user_id,
      description: `Payment created: ${payment.payment_order_id}`,
      metadata: { amount: input.amount_idr, method: input.payment_method, provider: input.provider },
    });

    return { payment, instructions: result.instructions };
  }

  async uploadProof(paymentId: string, userId: string, imageUrl: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.user_id !== userId) throw new Error("Unauthorized");
    if (payment.payment_status !== "pending") {
      throw new Error("Payment is not in pending status");
    }

    await this.paymentRepo.uploadProof(paymentId, imageUrl);

    await this.auditRepo.log("payment.proof_uploaded", {
      bookingId: payment.booking_id!,
      paymentId,
      actorId: userId,
      description: "Payment proof uploaded",
    });
  }

  async verifyPayment(paymentId: string, adminId: string, ip?: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.payment_status !== "waiting_verification") {
      throw new Error("Payment is not awaiting verification");
    }

    await this.paymentRepo.updatePaymentStatus(paymentId, "paid", { verified_by: adminId });

    if (payment.booking_id) {
      await this.bookingService.confirmBooking(payment.booking_id);
    }

    await this.auditRepo.log("payment.verified", {
      bookingId: payment.booking_id!,
      paymentId,
      actorId: adminId,
      actorIp: ip ?? null,
      description: `Payment verified: ${payment.payment_order_id}`,
      metadata: { amount: payment.amount_idr },
    });
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string, ip?: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.payment_status !== "waiting_verification") {
      throw new Error("Payment is not awaiting verification");
    }

    await this.paymentRepo.updatePaymentStatus(paymentId, "rejected", { reason, verified_by: adminId });

    await this.auditRepo.log("payment.rejected", {
      bookingId: payment.booking_id!,
      paymentId,
      actorId: adminId,
      actorIp: ip ?? null,
      description: `Payment rejected: ${reason}`,
      metadata: { reason },
    });
  }

  async refundPayment(paymentId: string, adminId: string, reason: string, ip?: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.payment_status !== "paid") {
      throw new Error("Payment is not in paid status");
    }

    await this.paymentRepo.updatePaymentStatus(paymentId, "refunded", { reason });

    if (payment.booking_id) {
      await this.bookingService.expireBooking(payment.booking_id, `Refunded: ${reason}`);
    }

    await this.auditRepo.log("payment.refunded", {
      bookingId: payment.booking_id!,
      paymentId,
      actorId: adminId,
      actorIp: ip ?? null,
      description: `Payment refunded: ${reason}`,
      metadata: { amount: payment.amount_idr, reason },
    });
  }

  async extendDeadline(paymentId: string, adminId: string, newExpiresAt: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error("Payment not found");

    if (payment.booking_id) {
      await this.bookingRepo.setExpiresAt(payment.booking_id, newExpiresAt);
    }

    await this.auditRepo.log("deadline.extended", {
      bookingId: payment.booking_id!,
      paymentId,
      actorId: adminId,
      description: "Payment deadline extended",
      metadata: { new_expires_at: newExpiresAt },
    });
  }

  async expireOverduePayments(): Promise<number> {
    const expired = await this.bookingRepo.cancelExpired();
    for (const b of expired) {
      const payments = await this.paymentRepo.findByBooking(b.id);
      for (const p of payments) {
        if (p.payment_status === "pending" || p.payment_status === "waiting_verification") {
          await this.paymentRepo.updatePaymentStatus(p.id, "expired");
        }
      }
      await this.auditRepo.log("booking.expired", {
        bookingId: b.id,
        description: "Booking expired - payment deadline passed",
      });
    }
    return expired.length;
  }
}
