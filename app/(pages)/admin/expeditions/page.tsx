import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { ExpeditionActions, AdminExpeditionForm, AdminAutoStatusButton } from "@/components/AdminActions";
import { tableStyle, rowStyle, Cell, TH } from "@/components/AdminTable";

export const metadata = { title: "Expeditions — Admin — VAKANSISME" };

export default async function AdminExpeditionsPage() {
  const { supabase } = await requireAdmin();

  const { data: expeditions } = await supabase
    .from("expeditions")
    .select("id, slug, name, location, difficulty, price, date_start, date_end, quota_max, leader_id, profiles!leader_id(username), image_url, description, requires_approval, application_prompt, featured, activity_category, destination_id, expedition_members(count)")
    .order("date_start", { ascending: true })
    .limit(50);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            EXPEDITIONS
          </h1>
        </div>

        <AdminNav active="expeditions" />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            EXPEDITIONS ({expeditions?.length ?? 0})
          </h2>
          <div style={{ marginBottom: "20px" }}>
            <AdminAutoStatusButton />
          </div>
          <AdminExpeditionForm />
          {!expeditions?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No expeditions.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Name</TH>
                    <TH>Location</TH>
                    <TH>Difficulty</TH>
                    <TH>Date</TH>
                    <TH>Members</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {expeditions.map((e) => {
                    const count = (e.expedition_members as { count: number }[])[0]?.count ?? 0;
                    return (
                      <tr key={e.id} style={rowStyle}>
                        <Cell>
                          <Link
                            href={`/expeditions/${e.slug}`}
                            className="hover:text-neon-green transition-colors duration-150"
                          >
                            {e.name}
                          </Link>
                        </Cell>
                        <Cell muted>{e.location}</Cell>
                        <Cell muted>{e.difficulty}</Cell>
                        <Cell muted>
                          {new Date(e.date_start).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                        </Cell>
                        <Cell muted>
                          {count} / {e.quota_max}
                        </Cell>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <ExpeditionActions expedition={e as Parameters<typeof ExpeditionActions>[0]["expedition"]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
