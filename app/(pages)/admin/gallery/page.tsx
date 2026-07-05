import Image from "next/image";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { GalleryModerationActions } from "@/components/AdminActions";

export const metadata = { title: "Gallery — Admin — VAKANSISME" };

export default async function AdminGalleryPage() {
  const { supabase } = await requireAdmin();

  const { data: pendingGallery } = await supabase
    .from("expedition_gallery")
    .select("id, expedition_id, uploader_handle, image_url, caption, status, created_at, expeditions(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            GALLERY
          </h1>
        </div>

        <AdminNav active="gallery" />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            GALLERY PENDING ({pendingGallery?.length ?? 0})
          </h2>
          {!pendingGallery?.length ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>No photos awaiting review.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingGallery.map((p) => {
                const trip = Array.isArray(p.expeditions) ? p.expeditions[0] : p.expeditions as { name: string } | null;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      background: "#1a1a1a",
                      border: "1px solid rgba(74,59,42,0.35)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0, overflow: "hidden" }}>
                      <Image src={p.image_url} alt={p.caption ?? ""} fill sizes="80px" className="object-cover" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>
                        @{p.uploader_handle}
                      </p>
                      <p className="font-body text-neon-green" style={{ fontSize: "0.65rem", letterSpacing: "0.04em", marginBottom: "4px" }}>
                        {trip?.name ?? "—"}
                      </p>
                      {p.caption && (
                        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", lineHeight: 1.4, marginBottom: "8px" }}>
                          {p.caption}
                        </p>
                      )}
                      <GalleryModerationActions id={p.id} initialStatus={p.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
