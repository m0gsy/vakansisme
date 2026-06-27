"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ready, setReady] = useState(false);
  const [type, setType] = useState<string>(TYPES[0]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      const [{ data: story }, { data: profile }] = await Promise.all([
        supabase
          .from("stories")
          .select("author_id, type, title, excerpt, content, image_url, status")
          .eq("id", id)
          .single(),
        supabase.from("profiles").select("username").eq("id", user.id).single(),
      ]);

      if (!story || story.author_id !== user.id) {
        router.replace("/stories");
        return;
      }

      setType(story.type);
      setTitle(story.title ?? "");
      setExcerpt(story.excerpt ?? "");
      setContent(story.content ?? "");
      setImageUrl(story.image_url ?? "");
      setStatus(story.status ?? "draft");
      setUsername(profile?.username ?? "");
      setReady(true);
    });
  }, [id, router]);

  // statusChange: undefined = save content only; "draft"/"pending" = also transition state.
  async function save(statusChange?: "draft" | "pending") {
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    const res = await fetch(`/api/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, excerpt, content, image_url: imageUrl, ...(statusChange ? { status: statusChange } : {}) }),
    });
    const json = await res.json();

    if (res.ok) {
      const nowStatus = statusChange ?? status;
      // Only published stories have a public detail page; everything else goes to the profile.
      router.push(nowStatus === "published" ? `/stories/${id}` : username ? `/u/${username}` : "/stories");
    } else {
      setError(json.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  const isPublished = status === "published";
  const STATUS_LABEL: Record<string, string> = { draft: "DRAFT", pending: "PENDING REVIEW", published: "PUBLISHED", rejected: "REJECTED" };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href={username ? `/u/${username}` : "/stories"}
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← BACK
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            EDIT STORY
          </h1>
          <span
            className="font-body font-semibold"
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              background: isPublished ? "#9BFF3C" : status === "pending" ? "#FF6B1A" : "#4A3B2A",
              color: status === "draft" || status === "rejected" ? "#F0EDEA" : "#111111",
              padding: "4px 10px",
              textTransform: "uppercase",
              alignSelf: "center",
            }}
          >
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>
        <p className="font-body text-muted-ink mb-12" style={{ fontSize: "0.88rem" }}>
          {status === "pending"
            ? "Awaiting admin review. You can still edit while you wait."
            : status === "rejected"
            ? "An admin declined this. Edit and resubmit for review."
            : "Changes save immediately on submit."}
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          style={{ display: "flex", flexDirection: "column", gap: "32px" }}
        >
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
              Excerpt
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={160}
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
              Cover image
            </label>
            <ImageUpload folder="stories" currentUrl={imageUrl} onUpload={(url) => setImageUrl(url)} />
          </div>

          {error && (
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                padding: "14px 32px",
                border: "none",
                cursor: loading || !title.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "SAVING..." : "SAVE CHANGES"}
            </button>

            {/* Draft/rejected → submit for review; pending/published → move to draft */}
            {(status === "draft" || status === "rejected") && (
              <button
                type="button"
                disabled={loading || !title.trim()}
                onClick={() => save("pending")}
                className="font-body font-semibold text-charcoal bg-chaos-orange hover:bg-neon-green transition-colors duration-150 disabled:opacity-50"
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  padding: "14px 24px",
                  border: "none",
                  cursor: loading || !title.trim() ? "not-allowed" : "pointer",
                }}
              >
                SUBMIT FOR REVIEW →
              </button>
            )}
            {(status === "pending" || status === "published") && (
              <button
                type="button"
                disabled={loading}
                onClick={() => save("draft")}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150 disabled:opacity-50"
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  padding: "14px 24px",
                  background: "transparent",
                  border: "1px solid rgba(74,59,42,0.5)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {status === "pending" ? "WITHDRAW TO DRAFT" : "MOVE TO DRAFT"}
              </button>
            )}

            <Link
              href={username ? `/u/${username}` : "/stories"}
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
