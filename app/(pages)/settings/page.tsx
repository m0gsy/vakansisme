"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";

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

export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [stravaUrl, setStravaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url, instagram_handle, strava_url")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setInstagramHandle(profile.instagram_handle ?? "");
        setStravaUrl(profile.strava_url ?? "");
      }
      setReady(true);
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        instagram_handle: instagramHandle.trim().replace(/^@/, "") || null,
        strava_url: stravaUrl.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setError(error.code === "23505" ? "Username already taken" : error.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-xl mx-auto px-6">
        <Link
          href={`/u/${username}`}
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-10"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← BACK TO PROFILE
        </Link>

        <h1
          className="font-display font-black uppercase text-off-white"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "48px" }}
        >
          EDIT PROFILE
        </h1>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Avatar */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Avatar
            </label>
            <ImageUpload folder="avatars" onUpload={setAvatarUrl} currentUrl={avatarUrl || undefined} />
          </div>

          {/* Username */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              required
              maxLength={30}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Bio */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Bio <span style={{ textTransform: "none", letterSpacing: 0 }}>({bio.length}/160)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Who are you out there?"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ ...inputStyle, lineHeight: 1.7 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Instagram */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Instagram <span style={{ textTransform: "none", letterSpacing: 0 }}>(without @)</span>
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value.replace(/\s/g, ""))}
              maxLength={30}
              placeholder="yourhandle"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {/* Strava */}
          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block mb-2"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
            >
              Strava URL <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="url"
              value={stravaUrl}
              onChange={(e) => setStravaUrl(e.target.value)}
              placeholder="https://www.strava.com/athletes/..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>

          {error && (
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>
          )}
          {success && (
            <p className="font-story text-neon-green" style={{ fontSize: "0.88rem" }}>Profile updated.</p>
          )}

          <button
            type="submit"
            disabled={saving || !username.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px", border: "none", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </form>
      </div>
    </div>
  );
}
