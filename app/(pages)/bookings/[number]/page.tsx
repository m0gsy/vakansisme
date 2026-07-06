import { createClient } from "@/lib/supabase/server";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { PaymentRepository } from "@/lib/repositories/payment.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import Link from "next/link";
import type { Metadata } from "next";
import PayButton from "@/components/PayButton";

export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Booking ${number} — VAKANSISME`,
    robots: { index: false },
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string) {
  const bg: Record<string, string> = {
    draft: "#4A3B2A",
    waiting_payment: "#FF6B1A",
    confirmed: "#9BFF3C",
    checked_in: "#9BFF3C",
    completed: "#4A3B2A",
    cancelled: "#7A2E12",
    expired: "#7A2E12",
    rejected: "#7A2E12",
    refunded: "#9BFF3C",
  };
  const fg: Record<string, string> = {
    confirmed: "#111",
    checked_in: "#111",
    refunded: "#111",
  };
  return (
    <span className="font-body font-semibold inline-block" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", padding: "4px 10px", background: bg[status] ?? "#4A3B2A", color: fg[status] ?? "#F0EDEA" }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

export default async function BookingDetailPage({ params }: { params: Params }) {
  const { number } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="min-h-screen bg-charcoal flex items-center justify-center"><p className="font-body text-muted-ink">Login required</p></div>;

  const bookingRepo = new BookingRepository(supabase);
  const paymentRepo = new PaymentRepository(supabase);
  const auditRepo = new AuditRepository(supabase);

  const booking = await bookingRepo.findByBookingNumber(number);
  if (!booking) return <div className="min-h-screen bg-charcoal flex items-center justify-center"><p className="font-body text-muted-ink">Booking not found</p></div>;

  const isOwner = booking.user_id === user.id;
  if (!isOwner) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return <div className="min-h-screen bg-charcoal flex items-center justify-center"><p className="font-body text-muted-ink">Unauthorized</p></div>;
  }

  const payments = await paymentRepo.findByBooking(booking.id);
  const timeline = await auditRepo.findByBooking(booking.id);

  const expedition = booking.expedition;
  const priceAmount = expedition?.price_amount ?? (parseInt((expedition?.price ?? "0").replace(/\D/g, ""), 10) || 0);
  const isPaid = payments.some((p) => p.payment_status === "paid");

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-3xl mx-auto px-6" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
        <Link
          href="/dashboard"
          className="font-body font-semibold hover:text-off-white transition-colors duration-200 inline-block mb-8"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em", padding: "8px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", textDecoration: "none" }}
        >
          ← DASHBOARD
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.025em", lineHeight: 0.9 }}>
            {booking.booking_number}
          </h1>
          {statusBadge(booking.booking_status)}
        </div>

        {expedition && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "8px" }}>TRIP</p>
            <Link href={`/expeditions/${expedition.slug}`} className="font-display font-bold uppercase text-off-white hover:text-neon-green transition-colors duration-150" style={{ fontSize: "1.2rem" }}>
              {expedition.name}
            </Link>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginTop: "4px" }}>{expedition.location}</p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginTop: "2px" }}>
              {new Date(expedition.date_start).toLocaleDateString("id", { day: "numeric", month: "long", year: "numeric" })} — {new Date(expedition.date_end).toLocaleDateString("id", { day: "numeric", month: "long" })}
            </p>
            {(expedition as Record<string, unknown>)?.cancellation_policy ? (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
                <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.14em", marginBottom: "4px" }}>PEMBATALAN</p>
                <p className="font-body text-off-white" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{String((expedition as Record<string, unknown>).cancellation_policy)}</p>
              </div>
            ) : null}
            {(expedition as Record<string, unknown>)?.refund_policy ? (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
                <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.14em", marginBottom: "4px" }}>REFUND</p>
                <p className="font-body text-off-white" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{String((expedition as Record<string, unknown>).refund_policy)}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>TIMELINE</p>
          {timeline.length === 0 ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>No activity recorded.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {timeline.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#9BFF3C", marginTop: "6px", flexShrink: 0 }} />
                  <div>
                    <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>{entry.description ?? entry.action}</p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment */}
        {booking.booking_status === "waiting_payment" && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>PEMBAYARAN</p>
            {payments.length > 0 && payments.some((p) => p.payment_status === "waiting_verification") ? (
              <div>
                <p className="font-body text-chaos-orange" style={{ fontSize: "0.85rem" }}>Bukti transfer sedang diverifikasi oleh admin.</p>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "8px" }}>
                  Kamu akan mendapat notifikasi setelah pembayaran dikonfirmasi.
                </p>
              </div>
            ) : (
              <PayButton
                bookingId={booking.id}
                expeditionId={booking.expedition_id}
                priceAmount={priceAmount}
                currentUserId={user.id}
                alreadyPaid={isPaid}
                paymentDueAt={booking.expires_at ?? booking.payment_due_at}
              />
            )}
          </div>
        )}

        {/* Payment info for cancelled bookings */}
        {["cancelled", "expired", "rejected"].includes(booking.booking_status) && payments.length > 0 && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>PEMBAYARAN</p>
            {payments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <p className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>
                    Rp {p.amount_idr.toLocaleString("id")} — {p.provider === "manual_transfer" ? "Transfer Bank" : p.provider}
                  </p>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>Via {p.payment_method ?? "-"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {p.payment_status === "cancelled" ? (
                    <span className="font-body font-semibold" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: "#7A2E12", color: "#F0EDEA" }}>
                      DIBATALKAN
                    </span>
                  ) : p.payment_status === "refunded" ? (
                    <span className="font-body font-semibold" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: "#9BFF3C", color: "#111" }}>
                      REFUNDED
                    </span>
                  ) : (
                    <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>{p.payment_status.replace("_", " ").toUpperCase()}</span>
                  )}
                </div>
              </div>
            ))}
            {payments.some((p) => p.payment_status === "cancelled") && !payments.some((p) => p.payment_status === "refunded") && (
              <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "8px" }}>
                Pembayaran dibatalkan. Admin akan memproses refund secara manual.
              </p>
            )}
            {payments.some((p) => p.payment_status === "refunded") && (
              <p className="font-body text-neon-green" style={{ fontSize: "0.72rem", marginTop: "8px" }}>
                Refund telah diproses.
              </p>
            )}
          </div>
        )}

        {/* Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px" }}>
            <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>Booking dibuat</p>
            <p className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>{formatDate(booking.joined_at)}</p>
          </div>
          {booking.expires_at && (
            <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px" }}>
              <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>Batas Pembayaran</p>
              <p className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>{formatDate(booking.expires_at)}</p>
            </div>
          )}
          {booking.cancelled_at && (
            <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px" }}>
              <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>Dibatalkan</p>
              <p className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>{formatDate(booking.cancelled_at)}</p>
              {booking.cancel_reason && <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "4px" }}>{booking.cancel_reason}</p>}
            </div>
          )}
          {booking.checked_in_at && (
            <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px" }}>
              <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "4px" }}>Check In</p>
              <p className="font-body text-off-white" style={{ fontSize: "0.82rem" }}>{formatDate(booking.checked_in_at)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
