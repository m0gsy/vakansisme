"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

const inputStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "10px 0",
  fontSize: "0.95rem",
  color: "#F0EDEA",
  width: "100%",
  outline: "none",
};

export default function NewSeriesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, cover_image: coverImage }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/series/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal membuat seri.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <Link
          href="/series"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← SERI CERITA
        </Link>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}
        >
          BUAT SERI BARU
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.14em", display: "block", marginBottom: "8px" }}>
              Judul Seri *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama seri ceritamu"
              maxLength={100}
              style={inputStyle}
              className="font-body"
            />
          </div>

          <div>
            <label className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.14em", display: "block", marginBottom: "8px" }}>
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tentang apa seri ini? (opsional)"
              maxLength={300}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", borderBottom: "none", border: "2px solid #4A3B2A", padding: "12px 14px" }}
              className="font-body"
            />
          </div>

          <div>
            <label className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.62rem", letterSpacing: "0.14em", display: "block", marginBottom: "8px" }}>
              Foto Cover
            </label>
            <ImageUpload folder="series" onUpload={setCoverImage} currentUrl={coverImage || undefined} />
          </div>

          {error && (
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: loading ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
          >
            {loading ? "MEMBUAT..." : "BUAT SERI"}
          </button>
        </form>
      </div>
    </div>
  );
}
