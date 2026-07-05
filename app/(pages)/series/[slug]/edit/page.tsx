"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UUID_RE } from "@/lib/seo";
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

type Params = Promise<{ slug: string }>;

export default function EditSeriesPage({ params }: { params: Params }) {
  const router = useRouter();
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesSlug, setSeriesSlug] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    params.then(({ slug }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data: auth }) => {
        if (!auth.user) { router.replace("/login"); return; }
        const select = "id, slug, title, description, cover_image, author_id";
        const { data: bySlug } = await supabase.from("story_series").select(select).eq("slug", slug).maybeSingle();
        const series = bySlug ?? (UUID_RE.test(slug)
          ? (await supabase.from("story_series").select(select).eq("id", slug).maybeSingle()).data
          : null);
        if (!series) { router.replace("/series"); return; }
        if (series.author_id !== auth.user.id) { router.replace(`/series/${series.slug}`); return; }
        if (series.slug !== slug && !redirected.current) {
          redirected.current = true; router.replace(`/series/${series.slug}/edit`); return;
        }
        setSeriesId(series.id);
        setSeriesSlug(series.slug);
        setTitle(series.title ?? "");
        setDescription(series.description ?? "");
        setCoverImage(series.cover_image ?? "");
        setLoaded(true);
      });
    });
  }, [params, router]);

  async function save() {
    if (!seriesId || !title.trim()) return;
    setError(""); setLoading(true);
    const res = await fetch(`/api/series/${seriesId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, cover_image: coverImage }),
    });
    const json = await res.json();
    if (res.ok) router.push(`/series/${seriesSlug}`);
    else { setError(json.error ?? "Gagal menyimpan perubahan."); setLoading(false); }
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <Link
          href={seriesSlug ? `/series/${seriesSlug}` : "/series"}
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← KEMBALI KE SERI
        </Link>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "48px" }}
        >
          UBAH SERI
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
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

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={save}
              disabled={loading || !title.trim()}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
            </button>
            <Link
              href={seriesSlug ? `/series/${seriesSlug}` : "/series"}
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
            >
              BATAL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
