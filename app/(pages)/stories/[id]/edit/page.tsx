"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";

const TYPES = ["photo dump", "short story", "video POV", "chaos moment"] as const;
const TAG_SUGGESTIONS = ["indonesia", "gunung", "pantai", "kota", "solo", "couple", "backpacker", "budget", "offroad", "night hike"];

const inputStyle = {
  background: "transparent", border: "none", borderBottom: "2px solid #4A3B2A",
  padding: "10px 0", fontSize: "0.95rem", color: "#F0EDEA", transition: "border-color 0.2s", width: "100%",
};

type Params = Promise<{ id: string }>;
type Expedition = { id: string; name: string };

export default function EditStoryPage({ params }: { params: Params }) {
  const router = useRouter();
  const [storyId, setStoryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<string>(TYPES[0]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [expeditionId, setExpeditionId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    params.then(({ id }) => {
      setStoryId(id);
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data: auth }) => {
        if (!auth.user) { router.replace("/login"); return; }
        const { data: story } = await supabase
          .from("stories")
          .select("author_id, type, title, excerpt, content, image_url, audio_url, expedition_id, tags, published")
          .eq("id", id).single();
        if (!story) { router.replace("/stories"); return; }
        if (story.published) {
          const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", auth.user.id).single();
          if (!profile?.is_admin && !redirected.current) {
            redirected.current = true; router.replace(`/stories/${id}`); return;
          }
        }
        setType(story.type ?? TYPES[0]);
        setTitle(story.title ?? "");
        setExcerpt(story.excerpt ?? "");
        setContent(story.content ?? "");
        setImageUrl(story.image_url ?? "");
        setAudioUrl(story.audio_url ?? "");
        setExpeditionId(story.expedition_id ?? "");
        setTags(story.tags ?? []);
        const { data: joined } = await supabase
          .from("expedition_members").select("expedition_id, expeditions(id, name)").eq("user_id", auth.user.id).limit(20);
        setExpeditions(joined?.flatMap((j) => {
          const e = Array.isArray(j.expeditions) ? j.expeditions[0] : j.expeditions as Expedition | null;
          return e ? [e] : [];
        }) ?? []);
        setLoaded(true);
      });
    });
  }, [params, router]);

  async function save() {
    if (!storyId || !title.trim()) return;
    setError(""); setLoading(true);
    const res = await fetch(`/api/stories/${storyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, excerpt, content, image_url: imageUrl, audio_url: audioUrl || null, expedition_id: expeditionId || null, tags }),
    });
    const json = await res.json();
    if (res.ok) router.push(`/stories/${storyId}`);
    else { setError(json.error ?? "Something went wrong"); setLoading(false); }
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <Link href={storyId ? `/stories/${storyId}` : "/stories"}
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          ← BACK TO STORY
        </Link>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "40px" }}>
          EDIT STORY
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Story type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className="font-body font-semibold transition-all duration-150"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.1em", padding: "7px 16px", border: "1px solid", cursor: "pointer", background: type === t ? "#9BFF3C" : "transparent", color: type === t ? "#111111" : "#7A7570", borderColor: type === t ? "#9BFF3C" : "rgba(74,59,42,0.5)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {expeditions.length > 0 && (
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Link to expedition <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <select value={expeditionId} onChange={(e) => setExpeditionId(e.target.value)}
                className="font-body text-off-white focus:outline-none"
                style={{ ...inputStyle, fontSize: "0.9rem", cursor: "pointer" }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}>
                <option value="" style={{ background: "#1a1a1a" }}>None</option>
                {expeditions.map((exp) => <option key={exp.id} value={exp.id} style={{ background: "#1a1a1a" }}>{exp.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="font-display font-bold uppercase text-off-white placeholder:text-muted-ink focus:outline-none"
              style={{ ...inputStyle, fontSize: "1.4rem", letterSpacing: "-0.01em" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Excerpt</label>
            <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={160}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Story</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ ...inputStyle, borderBottom: "2px solid #4A3B2A", padding: "10px 0", lineHeight: 1.8 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Cover image</label>
            <ImageUpload folder="stories" currentUrl={imageUrl} onUpload={setImageUrl} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Audio URL <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {tags.map((tag) => (
                <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "rgba(155,255,60,0.1)", border: "1px solid rgba(155,255,60,0.3)", fontSize: "0.65rem", color: "#9BFF3C" }}>
                  #{tag}
                  <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: "0.7rem" }}>✕</button>
                </span>
              ))}
            </div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/^#/, "");
                  if (t && !tags.includes(t) && tags.length < 5) { setTags((p) => [...p, t]); setTagInput(""); }
                }
              }}
              placeholder="Add tag, press Enter..." maxLength={30}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={{ ...inputStyle, fontSize: "0.85rem" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
              {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 6).map((s) => (
                <button key={s} type="button" onClick={() => { if (tags.length < 5) setTags((p) => [...p, s]); }}
                  className="font-body text-muted-ink hover:text-off-white transition-colors duration-150"
                  style={{ background: "none", border: "1px solid rgba(74,59,42,0.35)", padding: "3px 8px", fontSize: "0.6rem", cursor: "pointer" }}>
                  #{s}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={save} disabled={loading || !title.trim()}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 36px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "SAVING..." : "SAVE CHANGES"}
            </button>
            <Link href={storyId ? `/stories/${storyId}` : "/stories"}
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}>
              CANCEL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
