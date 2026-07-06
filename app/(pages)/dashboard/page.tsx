import { createClient } from "@/lib/supabase/server";
import { BookingRepository } from "@/lib/repositories/booking.repository";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — VAKANSISME",
  robots: { index: false },
};

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

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  const username = profile?.username ?? user.email?.split("@")[0] ?? "petualang";

  const bookingRepo = new BookingRepository(supabase);

  const bookings = await bookingRepo.findByUser(user.id);
  const pendingPayments = bookings.filter((b) => b.booking_status === "waiting_payment");
  const upcomingTrips = bookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "checked_in");
  const completedBookings = bookings.filter((b) => b.booking_status === "completed");

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          DASHBOARD
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "32px" }}>
          Selamat datang, @{username}
        </p>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "40px" }}>
          {[
            { label: "Akan Datang", count: upcomingTrips.length, color: "#9BFF3C" },
            { label: "Pending Bayar", count: pendingPayments.length, color: "#FF6B1A" },
            { label: "Selesai", count: completedBookings.length, color: "#4A3B2A" },
            { label: "Total Booking", count: bookings.length, color: "#8B7355" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px", textAlign: "center" }}>
              <p className="font-display font-black" style={{ fontSize: "2rem", color: stat.color, lineHeight: 1 }}>{stat.count}</p>
              <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginTop: "6px" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
          <Link href="/bookings" className="font-body font-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 22px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", textDecoration: "none" }}>
            SEMUA BOOKING →
          </Link>
          <Link href="/trips" className="font-body font-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 22px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", textDecoration: "none" }}>
            TRIP SAYA →
          </Link>
          <Link href={`/u/${username}`} className="font-body font-semibold" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "10px 22px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", textDecoration: "none" }}>
            PROFIL →
          </Link>
        </div>

        {/* Pending payments alert */}
        {pendingPayments.length > 0 && (
          <div style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.3)", padding: "16px 20px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="font-body font-semibold text-chaos-orange" style={{ fontSize: "0.82rem" }}>{pendingPayments.length} booking menunggu pembayaran</p>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "2px" }}>Segera selesaikan pembayaran untuk mengamankan kursi!</p>
            </div>
            <Link
              href="/bookings"
              className="font-body font-semibold"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "8px 16px", background: "#FF6B1A", color: "#111", textDecoration: "none" }}
            >
              BAYAR SEKARANG
            </Link>
          </div>
        )}

        {/* Empty state */}
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
