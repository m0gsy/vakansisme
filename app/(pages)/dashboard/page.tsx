import { createClient } from "@/lib/supabase/server";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import { PaymentRepository } from "@/lib/repositories/payment.repository";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — VAKANSISME",
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

export default async function DashboardPage() {
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
  const paymentRepo = new PaymentRepository(supabase);

  const bookings = await bookingRepo.findByUser(user.id);
  const pendingPayments = bookings.filter((b) => b.booking_status === "waiting_payment");
  const upcomingTrips = bookings.filter((b) => b.booking_status === "confirmed");
  const completedBookings = bookings.filter((b) => b.booking_status === "completed" || b.booking_status === "checked_in");
  const cancelledBookings = bookings.filter((b) => b.booking_status === "cancelled" || b.booking_status === "expired");

  const allPayments = await paymentRepo.findByUser(user.id);

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          DASHBOARD
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "40px" }}>
          Selamat datang, @{user.email?.split("@")[0] ?? "petualang"}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "40px" }}>
          {[
            { label: "Akan Datang", count: upcomingTrips.length, color: "#9BFF3C" },
            { label: "Pending Bayar", count: pendingPayments.length, color: "#FF6B1A" },
            { label: "Selesai", count: completedBookings.length, color: "#4A3B2A" },
            { label: "Riwayat", count: cancelledBookings.length, color: "#7A2E12" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px", textAlign: "center" }}>
              <p className="font-display font-black" style={{ fontSize: "2rem", color: stat.color, lineHeight: 1 }}>{stat.count}</p>
              <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginTop: "6px" }}>{stat.label}</p>
            </div>
          ))}
        </div>

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
              Trip Akan Datang ({upcomingTrips.length})
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

        {allPayments.length > 0 && (
          <section>
            <h2 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Riwayat Pembayaran
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {allPayments.slice(0, 20).map((payment) => (
                <div key={payment.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
                  <div>
                    <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>{payment.payment_order_id}</p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>{new Date(payment.created_at).toLocaleDateString("id")}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payment.amount_idr)}
                    </p>
                    {statusBadge(payment.payment_status)}
                  </div>
                </div>
              ))}
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
