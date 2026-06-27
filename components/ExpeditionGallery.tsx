"use client";

import { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";

type Photo = {
  id: string;
  uploader_id: string;
  uploader_handle: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export default function ExpeditionGallery({
  expeditionId,
  initialPhotos,
  isMember,
  currentUserId,
  tripStatus,
}: {
  expeditionId: string;
  initialPhotos: Photo[];
  isMember: boolean;
  currentUserId: string | null;
  tripStatus?: string | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(url: string) {
    setNewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl) return;
    setUploading(true);
    setError("");
    const res = await fetch(`/api/expeditions/${expeditionId}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: newUrl, caption }),
    });
    const json = await res.json();
    if (res.ok) {
      setPhotos((prev) => [...prev, json]);
      setNewUrl("");
      setCaption("");
      setOpen(false);
    } else {
      setError(json.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleDelete(photoId: string) {
    await fetch(`/api/expeditions/${expeditionId}/gallery`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  return (
    <section style={{ marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", letterSpacing: "-0.02em" }}
        >
          TRIP GALLERY ({photos.length})
        </h2>
        {isMember && !open && tripStatus === "completed" && (
          <button
            onClick={() => setOpen(true)}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
            style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "8px 16px", border: "none", cursor: "pointer" }}
          >
            + ADD PHOTO
          </button>
        )}
        {isMember && !open && tripStatus !== "completed" && (
          <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
            Upload opens after trip completes
          </span>
        )}
      </div>

      {/* Upload form */}
      {open && (
        <form onSubmit={handleSubmit} style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "20px", marginBottom: "24px" }}>
          <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em", marginBottom: "16px" }}>
            ADD TO GALLERY
          </p>
          <div style={{ marginBottom: "14px" }}>
            <ImageUpload folder="gallery" currentUrl={newUrl} onUpload={handleUpload} />
          </div>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={120}
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none w-full"
            style={{ background: "transparent", border: "none", borderBottom: "2px solid #4A3B2A", padding: "8px 0", fontSize: "0.85rem", marginBottom: "16px" }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
          />
          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.75rem", marginBottom: "10px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={uploading || !newUrl}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-40"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "9px 20px", border: "none", cursor: uploading ? "not-allowed" : "pointer" }}
            >
              {uploading ? "UPLOADING..." : "ADD PHOTO"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNewUrl(""); setCaption(""); }}
              className="font-body text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem" }}
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Gallery grid */}
      {photos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "#1a1a1a" }}>
              <Image
                src={p.image_url}
                alt={p.caption ?? ""}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(17,17,17,0.85) 0%, transparent 50%)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                className="hover:opacity-100"
              />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px", pointerEvents: "none" }}>
                {p.caption && (
                  <p className="font-body text-off-white/90" style={{ fontSize: "0.72rem", lineHeight: 1.4, marginBottom: "4px" }}>
                    {p.caption}
                  </p>
                )}
                <p className="font-body text-muted-ink" style={{ fontSize: "0.62rem" }}>
                  @{p.uploader_handle}
                </p>
              </div>
              {currentUserId === p.uploader_id && (
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(17,17,17,0.75)",
                    border: "none",
                    color: "#FF6B1A",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem" }}>
          {isMember ? "No photos yet. Be the first to add one." : "No photos yet."}
        </p>
      )}
    </section>
  );
}
