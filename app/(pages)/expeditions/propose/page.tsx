"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTIES } from "@/lib/difficulty";
import ImageUpload from "@/components/ImageUpload";

const INPUT = {
  base: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid #4A3B2A",
    padding: "8px 0",
    fontSize: "0.9rem",
    color: "#F0EDEA",
    width: "100%",
    outline: "none",
  } as React.CSSProperties,
};

export default function ProposePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    location: "",
    difficulty: "Moderate",
    activity_category: "Other",
    price: "Free",
    date_start: "",
    date_end: "",
    quota_max: "10",
    description: "",
    image_url: "",
    requires_approval: false,
  });
  const [activities, setActivities] = useState<string[]>(["Other"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then(({ activities: a }) => {
        const names = (a ?? []).filter((x: { archived: boolean }) => !x.archived).map((x: { name: string }) => x.name);
        if (names.length) setActivities(names);
      });
  }, []);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/expeditions/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quota_max: Number(form.quota_max) }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong"); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-charcoal" style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <p className="font-display font-black uppercase text-neon-green" style={{ fontSize: "2rem", letterSpacing: "-0.02em", marginBottom: "16px" }}>PROPOSAL SENT</p>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "32px" }}>Tim kami akan review dan kamu akan diberitahu via email + notifikasi.</p>
          <button onClick={() => router.push("/expeditions")} className="font-body font-semibold text-charcoal bg-neon-green" style={{ padding: "12px 28px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.14em" }}>
            BACK TO EXPEDITIONS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal" style={{ padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: "8px" }}>EXPEDITIONS</p>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          PROPOSE A TRIP
        </h1>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem", marginBottom: "40px" }}>
          Proposal akan direview oleh tim. Setelah disetujui, trip kamu langsung live dan kamu otomatis jadi leader.
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Cover Image */}
          <div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "10px" }}>COVER IMAGE (optional)</p>
            <ImageUpload folder="expeditions" currentUrl={form.image_url} onUpload={(url) => set("image_url", url)} />
          </div>

          {/* Name */}
          <div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>TRIP NAME *</p>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Gunung Semeru via Ranu Kumbolo" className="font-body placeholder:text-muted-ink" style={INPUT.base}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>

          {/* Location */}
          <div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>LOCATION *</p>
            <input required value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lumajang, East Java" className="font-body placeholder:text-muted-ink" style={INPUT.base}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>

          {/* Difficulty + Activity + Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>DIFFICULTY *</p>
              <select required value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="font-body"
                style={{ ...INPUT.base, cursor: "pointer" }}>
                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value} style={{ background: "#1a1a1a" }}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>ACTIVITY</p>
              <select value={form.activity_category} onChange={(e) => set("activity_category", e.target.value)} className="font-body"
                style={{ ...INPUT.base, cursor: "pointer" }}>
                {activities.map((c) => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>PRICE *</p>
              <input required value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. Free or Rp 150000" className="font-body placeholder:text-muted-ink" style={INPUT.base}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>START DATE *</p>
              <input required type="date" value={form.date_start} onChange={(e) => set("date_start", e.target.value)} className="font-body" style={{ ...INPUT.base, colorScheme: "dark" }} />
            </div>
            <div>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>END DATE *</p>
              <input required type="date" value={form.date_end} onChange={(e) => set("date_end", e.target.value)} className="font-body" style={{ ...INPUT.base, colorScheme: "dark" }} />
            </div>
          </div>

          {/* Quota */}
          <div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>MAX PARTICIPANTS *</p>
            <input required type="number" min="2" max="100" value={form.quota_max} onChange={(e) => set("quota_max", e.target.value)} className="font-body placeholder:text-muted-ink" style={INPUT.base}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>

          {/* Description */}
          <div>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "6px" }}>DESCRIPTION (optional)</p>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ceritain trip-nya…" rows={4} className="font-body placeholder:text-muted-ink"
              style={{ ...INPUT.base, resize: "vertical", padding: "8px 0" }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")} onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")} />
          </div>

          {/* Requires approval */}
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.requires_approval} onChange={(e) => set("requires_approval", e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "#9BFF3C" }} />
            <span className="font-body text-muted-ink" style={{ fontSize: "0.8rem" }}>Require member approval (manual review per applicant)</span>
          </label>

          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.8rem" }}>{error}</p>}

          <button type="submit" disabled={loading} className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ padding: "16px 32px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.14em" }}>
            {loading ? "SUBMITTING…" : "SUBMIT PROPOSAL"}
          </button>
        </form>
      </div>
    </div>
  );
}
