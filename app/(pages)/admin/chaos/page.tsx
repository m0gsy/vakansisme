import Image from "next/image";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { ChaosActions } from "@/components/AdminActions";
import { tableStyle, rowStyle, Cell, TH } from "@/components/AdminTable";

export const metadata = { title: "Chaos Wall — Admin — VAKANSISME" };

export default async function AdminChaosPage() {
  const { supabase } = await requireAdmin();

  const { data: chaos } = await supabase
    .from("chaos_submissions")
    .select("id, author_handle, type, caption, image_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            CHAOS WALL
          </h1>
        </div>

        <AdminNav active="chaos" />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            CHAOS WALL ({chaos?.length ?? 0})
          </h2>
          {!chaos?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No submissions.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                  <tr>
                    <TH>Image</TH>
                    <TH>Author</TH>
                    <TH>Type</TH>
                    <TH>Caption</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {chaos.map((c) => (
                    <tr key={c.id} style={rowStyle}>
                      <Cell>
                        {c.image_url ? (
                          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                            <Image
                              src={c.image_url}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              style={{ filter: "grayscale(20%)" }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{ width: 48, height: 48, background: "rgba(74,59,42,0.3)" }}
                          />
                        )}
                      </Cell>
                      <Cell>@{c.author_handle}</Cell>
                      <Cell muted>{c.type}</Cell>
                      <Cell muted>
                        {c.caption
                          ? c.caption.length > 60
                            ? c.caption.slice(0, 60) + "…"
                            : c.caption
                          : "—"}
                      </Cell>
                      <Cell muted>
                        {new Date(c.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </Cell>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <ChaosActions id={c.id} initialStatus={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
