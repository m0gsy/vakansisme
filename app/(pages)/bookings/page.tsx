import { createClient } from "@/lib/supabase/server";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings — VAKANSISME",
  robots: { index: false },
};

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    draft: "#4A3B2A",
    waiting_payment: "#FF6B1A",
    confirmed: "#9BFF3C",
    checked_in: "#9BFF3C",
    completed: "#4A3B2A",
    cancelled: "#7A2E12",
    expired: "#7A2E12",
    rejected: "#7A2E12",
  };
  const textColors: Record<string, string> = {
    confirmed: "#111",
    checked_in: "#111",
  };
  return (
    <span className="font-body font-semibold inline-block" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "3px 8px", background: colors[status] ?? "#4A3B2A", color: textColors[status] ?? "#F0EDEA" }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>Login required</p>
          <Link href="/login" className="font-body font-semibold text-neon-green" style={{ fontSize: "0.82rem" }}>Login</Link>
        </div>
      </div>
    );
  }

  const bookingRepo = new BookingRepository(supabase);
  const bookings = await bookingRepo.findByUser(user.id);

  const pendingPayments = bookings.filter((b) => b.booking_status === "waiting_payment");
  const upcomingTrips = bookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "checked_in");
  const completedBookings = bookings.filter((b) => b.booking_status === "completed");
  const cancelledBookings = bookings.filter((b) => b.booking_status === "cancelled" || b.booking_status === "expired" || b.booking_status === "rejected");
  const drafts = bookings.filter((b) => b.booking_status === "draft");

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "8px" }}>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 0.9 }}>
            BOOKINGS
          </h1>
          <Link href="/dashboard" className="font-body text-muted-ink hover:text-off-white transition-colors duration-150" style={{ fontSize: "0.72rem", letterSpacing: "0.12em" }}>
            ← DASHBOARD
          </Link>
        </div>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "40px" }}>
          Semua booking petualanganmu
        </p>

        {pendingPayments.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Menunggu Pembayaran ({pendingPayments.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingPayments.map((booking) => {
                const exp = booking.expedition;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.booking_number}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(255,107,26,0.3)", textDecoration: "none" }}
                  >
                    <div>
                      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem" }}>{exp?.name ?? "Unknown Trip"}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{booking.booking_number}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {statusBadge(booking.booking_status)}
                      {booking.expires_at && (
                        <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", marginTop: "4px" }}>
                          Deadline: {new Date(booking.expires_at).toLocaleDateString("id")}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {upcomingTrips.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Akan Datang ({upcomingTrips.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {upcomingTrips.map((booking) => {
                const exp = booking.expedition;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.booking_number}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", textDecoration: "none" }}
                  >
                    <div>
                      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem" }}>{exp?.name ?? "Unknown Trip"}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>
                        {exp ? `${exp.location} · ${new Date(exp.date_start).toLocaleDateString("id", { day: "numeric", month: "long" })}` : booking.booking_number}
                      </p>
                    </div>
                    {statusBadge(booking.booking_status)}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {drafts.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Draft ({drafts.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {drafts.map((booking) => {
                const exp = booking.expedition;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.booking_number}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", textDecoration: "none" }}
                  >
                    <div>
                      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem" }}>{exp?.name ?? "Unknown Trip"}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{booking.booking_number}</p>
                    </div>
                    {statusBadge(booking.booking_status)}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {completedBookings.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Selesai ({completedBookings.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {completedBookings.map((booking) => {
                const exp = booking.expedition;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.booking_number}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", textDecoration: "none" }}
                  >
                    <div>
                      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem" }}>{exp?.name ?? "Unknown Trip"}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{booking.booking_number}</p>
                    </div>
                    {statusBadge(booking.booking_status)}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {cancelledBookings.length > 0 && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Dibatalkan / Kedaluwarsa ({cancelledBookings.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cancelledBookings.map((booking) => {
                const exp = booking.expedition;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.booking_number}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", textDecoration: "none" }}
                  >
                    <div>
                      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem" }}>{exp?.name ?? "Unknown Trip"}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{booking.booking_number}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {statusBadge(booking.booking_status)}
                      {booking.cancel_reason && (
                        <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", marginTop: "4px" }}>{booking.cancel_reason}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {bookings.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>Belum ada booking. Mulai petualanganmu!</p>
            <Link href="/expeditions" className="font-body font-semibold text-neon-green hover:text-off-white transition-colors duration-150" style={{ fontSize: "0.82rem", letterSpacing: "0.12em" }}>
              JELAJAHI EXPEDISI →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
