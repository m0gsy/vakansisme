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

type Prefs = {
  email_on_join: boolean;
  email_on_story: boolean;
  email_on_status: boolean;
  email_newsletter: boolean;
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
  const [prefs, setPrefs] = useState<Prefs>({ email_on_join: true, email_on_story: true, email_on_status: true, email_newsletter: true });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsOk, setPrefsOk] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUserId(data.user.id);
      const [{ data: profile }, { prefs: fetchedPrefs }] = await Promise.all([
        supabase.from("profiles").select("username, bio, avatar_url, instagram_handle, strava_url").eq("id", data.user.id).single(),
        fetch("/api/account/notification-prefs").then((r) => r.json()),
      ]);
      if (profile) {
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setInstagramHandle(profile.instagram_handle ?? "");
        setStravaUrl(profile.strava_url ?? "");
      }
      if (fetchedPrefs) setPrefs(fetchedPrefs);
      setReady(true);
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl || null,
      instagram_handle: instagramHandle.trim().replace(/^@/, "") || null,
      strava_url: stravaUrl.trim() || null,
    }).eq("id", userId);
    if (error) {
      setError(error.code === "23505" ? "Username already taken" : error.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleSavePrefs() {
    setPrefsSaving(true);
    await fetch("/api/account/notification-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setPrefsOk(true);
    setPrefsSaving(false);
    setTimeout(() => setPrefsOk(false), 2000);
  }

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
    } else {
      setPushStatus(Notification.permission as "default" | "granted" | "denied");
    }
  }, []);

  async function enablePush() {
    if (!("serviceWorker" in navigator)) return;
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushStatus("denied"); setPushLoading(false); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const { key } = await fetch("/api/push/vapid-key").then((r) => r.json());
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setPushStatus("granted");
    } catch {
      setPushStatus("denied");
    }
    setPushLoading(false);
  }

  async function handleDelete() {
    if (deleteConfirm !== username) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/account/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } else {
      const json = await res.json();
      setDeleteError(json.error ?? "Failed to delete account");
      setDeleting(false);
    }
  }

  if (!ready) return null;

  const togglePref = (key: keyof Prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const prefLabels: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "email_on_join", label: "Join confirmations", desc: "Email when you join an expedition" },
    { key: "email_on_story", label: "Story approved", desc: "Email when your story goes live" },
    { key: "email_on_status", label: "Trip status changes", desc: "Email when trip is cancelled, underway, or complete" },
    { key: "email_newsletter", label: "Newsletter", desc: "Occasional updates from the crew" },
  ];

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

        {/* Profile form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Avatar</label>
            <ImageUpload folder="avatars" onUpload={setAvatarUrl} currentUrl={avatarUrl || undefined} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Username *</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} required maxLength={30}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Bio <span style={{ textTransform: "none", letterSpacing: 0 }}>({bio.length}/160)</span></label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} placeholder="Who are you out there?"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none" style={{ ...inputStyle, lineHeight: 1.7 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Instagram <span style={{ textTransform: "none", letterSpacing: 0 }}>(without @)</span></label>
            <input type="text" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value.replace(/\s/g, ""))} maxLength={30} placeholder="yourhandle"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>Strava URL <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <input type="url" value={stravaUrl} onChange={(e) => setStravaUrl(e.target.value)} placeholder="https://www.strava.com/athletes/..."
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>
          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{error}</p>}
          {success && <p className="font-story text-neon-green" style={{ fontSize: "0.88rem" }}>Profile updated.</p>}
          <button type="submit" disabled={saving || !username.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </form>

        {/* Notification prefs */}
        <div style={{ marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            EMAIL NOTIFICATIONS
          </h2>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "24px" }}>Control which emails you receive.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {prefLabels.map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
                <div>
                  <p className="font-body font-semibold text-off-white" style={{ fontSize: "0.82rem" }}>{label}</p>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.7rem", marginTop: "2px" }}>{desc}</p>
                </div>
                <button
                  onClick={() => togglePref(key)}
                  style={{
                    width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer",
                    background: prefs[key] ? "#9BFF3C" : "rgba(74,59,42,0.4)",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: "3px", left: prefs[key] ? "21px" : "3px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: prefs[key] ? "#111111" : "#8B7355",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSavePrefs} disabled={prefsSaving}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "11px 24px", border: "none", cursor: "pointer" }}>
            {prefsSaving ? "SAVING..." : prefsOk ? "SAVED ✓" : "SAVE PREFERENCES"}
          </button>
        </div>

        {/* Push notifications */}
        {pushStatus !== "unsupported" && (
          <div style={{ marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              BROWSER NOTIFICATIONS
            </h2>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "20px" }}>
              Get notified instantly — even when you&apos;re not on the site.
            </p>
            {pushStatus === "denied" && (
              <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginBottom: "12px" }}>
                Permission denied. Enable in your browser settings.
              </p>
            )}
            {pushStatus !== "granted" ? (
              <button
                onClick={enablePush}
                disabled={pushLoading || pushStatus === "denied"}
                className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-40"
                style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "11px 24px", border: "none", cursor: "pointer" }}
              >
                {pushLoading ? "ENABLING..." : "ENABLE NOTIFICATIONS"}
              </button>
            ) : (
              <p className="font-body font-semibold text-neon-green" style={{ fontSize: "0.78rem" }}>
                NOTIFICATIONS ENABLED ✓
              </p>
            )}
          </div>
        )}

        {/* Delete account */}
        <div style={{ marginTop: "64px", paddingTop: "48px", borderTop: "1px solid rgba(122,46,18,0.4)" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            DELETE ACCOUNT
          </h2>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.8rem", marginBottom: "20px", lineHeight: 1.6 }}>
            This is permanent. All your stories, trips, and data will be removed. Type your username to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={`Type "${username}" to confirm`}
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
            style={{ ...inputStyle, marginBottom: "12px", borderBottomColor: deleteConfirm === username ? "#FF6B1A" : "#4A3B2A" }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#FF6B1A")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = deleteConfirm === username ? "#FF6B1A" : "#4A3B2A")}
          />
          {deleteError && <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginBottom: "10px" }}>{deleteError}</p>}
          <button
            onClick={handleDelete}
            disabled={deleting || deleteConfirm !== username}
            className="font-body font-semibold disabled:opacity-30 transition-opacity duration-150"
            style={{ fontSize: "0.68rem", letterSpacing: "0.12em", padding: "11px 24px", background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.5)", color: "#FF6B1A", cursor: deleting || deleteConfirm !== username ? "not-allowed" : "pointer" }}
          >
            {deleting ? "DELETING..." : "DELETE ACCOUNT"}
          </button>
        </div>
      </div>
    </div>
  );
}
