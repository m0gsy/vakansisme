"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";

const TYPES = ["photo dump", "short story", "video POV", "chaos moment"] as const;

const inputStyle = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "10px 0",
  fontSize: "0.95rem",
  color: "#F0EDEA",
  transition: "border-color 0.2s",
  width: "100%",
};

export default function NewStoryPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [type, setType] = useState<string>(TYPES[0]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();
      setUsername(profile?.username ?? "");
      setChecked(true);
    });
  }, [router]);

  async function submit(forReview: boolean) {
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, excerpt, content, image_url: imageUrl, submit: forReview }),
    });
    const json = await res.json();

    if (res.ok) {
      // Story isn't public yet (pending review or draft) — send author to their profile.
      router.push(username ? `/u/${username}` : "/stories");
    } else {
      setError(json.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        {/* Back */}
        <Link
          href="/#journal"
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← BACK TO JOURNAL
        </Link>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, marginBottom: "12px" }}
        >
          WRITE YOUR STORY
        </h1>
        <p className="font-body text-muted-ink mb-12" style={{ fontSize: "0.88rem" }}>
          Raw. Honest. No filters. Goes live once an admin approves it.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); submit(true); }} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Type */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Story type
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="font-body font-semibold transition-all duration-150"
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    padding: "7px 16px",
                    border: "1px solid",
                    cursor: "pointer",
                    background: type === t ? "#9BFF3C" : "transparent",
                    color: type === t ? "#111111" : "#7A7570",
                    borderColor: type === t ? "#9BFF3C" : "rgba(74,59,42,0.5)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Give it a name"
              className="font-display font-bold uppercase text-off-white placeholder:text-muted-ink focus:outline-none"
              style={{ ...inputStyle, fontSize: "1.4rem", letterSpacing: "-0.01em" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Excerpt <span style={{ textTransform: "none", letterSpacing: 0 }}>(shown in journal grid)</span>
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={160}
              placeholder="One punchy line"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Content */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Story
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="What actually happened out there..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ ...inputStyle, borderBottom: "2px solid #4A3B2A", padding: "10px 0", lineHeight: 1.8 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Cover image */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Cover image <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <ImageUpload
              folder="stories"
              currentUrl={imageUrl}
              onUpload={(url) => setImageUrl(url)}
            />
          </div>

          {error && (
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                padding: "14px 36px",
                border: "none",
                cursor: loading || !title.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "SAVING..." : "SUBMIT FOR REVIEW"}
            </button>
            <button
              type="button"
              disabled={loading || !title.trim()}
              onClick={() => submit(false)}
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150 disabled:opacity-50"
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                padding: "14px 24px",
                background: "transparent",
                border: "1px solid rgba(74,59,42,0.5)",
                cursor: loading || !title.trim() ? "not-allowed" : "pointer",
              }}
            >
              SAVE AS DRAFT
            </button>
            <Link
              href="/stories"
              className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
            >
              CANCEL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
