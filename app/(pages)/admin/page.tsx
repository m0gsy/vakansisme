import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { AdminExportButtons } from "@/components/AdminActions";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata = { title: "Admin — VAKANSISME" };

function StatCard({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link
      href={href}
      className="hover:border-neon-green transition-colors duration-150"
      style={{ display: "block", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px", textDecoration: "none" }}
    >
      <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "8px" }}>{label}</p>
      <p className="font-display font-black text-off-white" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>{value}</p>
    </Link>
  );
}

function SectionCard({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="hover:border-neon-green hover:text-neon-green transition-colors duration-150"
      style={{ display: "block", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "20px", textDecoration: "none" }}
    >
      <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>{label} →</p>
    </Link>
  );
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: pendingStoriesCount },
    { count: pendingProposalsCount },
    { count: pendingGalleryCount },
    { count: usersCount },
    { count: subscriberCount },
  ] = await Promise.all([
    supabase.from("stories").select("*", { count: "exact", head: true }).eq("published", false).eq("status", "pending"),
    supabase.from("expedition_proposals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("expedition_gallery").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <p
            className="font-body font-semibold text-chaos-orange uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}
          >
            ADMIN
          </p>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            CONTROL PANEL
          </h1>
        </div>

        <AdminNav active="dashboard" />

        {/* Quick stats */}
        <section style={{ marginBottom: "48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
            <StatCard label="Pending Stories" value={pendingStoriesCount ?? 0} href="/admin/stories" />
            <StatCard label="Pending Proposals" value={pendingProposalsCount ?? 0} href="/admin/proposals" />
            <StatCard label="Pending Gallery" value={pendingGalleryCount ?? 0} href="/admin/gallery" />
            <StatCard label="Users" value={usersCount ?? 0} href="/admin/users" />
          </div>
        </section>

        {/* Section grid */}
        <section style={{ marginBottom: "56px" }}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            SECTIONS
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <SectionCard label="Gallery" href="/admin/gallery" />
            <SectionCard label="Stories" href="/admin/stories" />
            <SectionCard label="Chaos Wall" href="/admin/chaos" />
            <SectionCard label="Expeditions" href="/admin/expeditions" />
            <SectionCard label="Destinations" href="/admin/destinations" />
            <SectionCard label="Users" href="/admin/users" />
            <SectionCard label="Proposals" href="/admin/proposals" />
            <SectionCard label="Activities" href="/admin/activities" />
            <SectionCard label="Reminders" href="/admin/reminders" />
            <SectionCard label="Content Reports" href="/admin/reports" />
          </div>
        </section>

        {/* Export */}
        <section style={{ marginBottom: "56px" }}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            EXPORT DATA
          </h2>
          <AdminExportButtons />
        </section>

        {/* Newsletter */}
        <section style={{ marginBottom: "56px" }}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            NEWSLETTER ({subscriberCount ?? 0} subscribers)
          </h2>
          <NewsletterForm subscriberCount={subscriberCount ?? 0} />
        </section>

      </div>
    </div>
  );
}
