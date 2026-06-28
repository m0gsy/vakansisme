"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { DIFFICULTIES } from "@/lib/difficulty";
import ExpeditionMapClient from "@/components/ExpeditionMapClient";

const BTN = {
  base: {
    fontFamily: "inherit",
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    padding: "5px 12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  } as React.CSSProperties,
};

export function ChaosActions({ id, initialStatus }: { id: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function setModStatus(next: string) {
    setLoading(true);
    await fetch(`/api/admin/chaos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this chaos card?")) return;
    setLoading(true);
    await fetch(`/api/admin/chaos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          fontWeight: 700,
          padding: "3px 8px",
          background:
            status === "approved"
              ? "#9BFF3C"
              : status === "rejected"
              ? "#FF6B1A"
              : "rgba(74,59,42,0.4)",
          color: status === "pending" ? "#8B7355" : "#111111",
        }}
      >
        {status.toUpperCase()}
      </span>
      {status !== "approved" && (
        <button
          disabled={loading}
          onClick={() => setModStatus("approved")}
          style={{ ...BTN.base, background: "#9BFF3C", color: "#111111" }}
        >
          APPROVE
        </button>
      )}
      {status !== "rejected" && (
        <button
          disabled={loading}
          onClick={() => setModStatus("rejected")}
          style={{ ...BTN.base, background: "rgba(255,107,26,0.15)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}
        >
          REJECT
        </button>
      )}
      <button
        disabled={loading}
        onClick={del}
        style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}
      >
        DELETE
      </button>
    </div>
  );
}

export function ExpeditionDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function del() {
    if (!confirm("Delete this expedition and all its members?")) return;
    setLoading(true);
    await fetch(`/api/admin/expeditions/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={del}
      style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}
    >
      {loading ? "…" : "DELETE"}
    </button>
  );
}

const EXPEDITION_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

type ExpeditionData = {
  id: string;
  name: string;
  location: string;
  difficulty: string;
  price: string;
  date_start: string;
  date_end: string;
  quota_max: number;
  leader_handle: string;
  image_url?: string | null;
  description?: string | null;
  status?: string | null;
  requires_approval?: boolean | null;
  application_prompt?: string | null;
  featured?: boolean | null;
};

export function ExpeditionActions({ expedition }: { expedition: ExpeditionData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [featLoading, setFeatLoading] = useState(false);
  const [featured, setFeatured] = useState(expedition.featured ?? false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(expedition.image_url ?? "");
  const [editRequiresApproval, setEditRequiresApproval] = useState(expedition.requires_approval ?? false);
  const [fields, setFields] = useState({
    name: expedition.name,
    location: expedition.location,
    difficulty: expedition.difficulty,
    price: expedition.price,
    date_start: expedition.date_start?.slice(0, 10) ?? "",
    date_end: expedition.date_end?.slice(0, 10) ?? "",
    quota_max: String(expedition.quota_max),
    leader_handle: expedition.leader_handle,
    description: expedition.description ?? "",
    application_prompt: expedition.application_prompt ?? "",
    status: expedition.status ?? "upcoming",
  });

  function set(key: string, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  async function del() {
    if (!confirm("Delete this expedition and all its members?")) return;
    setLoading(true);
    await fetch(`/api/admin/expeditions/${expedition.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin/expeditions/${expedition.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, image_url: imageUrl, requires_approval: editRequiresApproval }),
    });
    const json = await res.json();
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  if (editing) {
    return (
      <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.5)", padding: "20px", marginTop: "8px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            {[
              { key: "name", label: "Name *", placeholder: "Mount Rinjani Circuit" },
              { key: "location", label: "Location *", placeholder: "Lombok, Indonesia" },
              { key: "price", label: "Price *", placeholder: "Rp 2.500.000" },
              { key: "leader_handle", label: "Leader *", placeholder: "@username" },
              { key: "quota_max", label: "Quota *", placeholder: "12", type: "number" },
              { key: "date_start", label: "Date start *", type: "date" },
              { key: "date_end", label: "Date end *", type: "date" },
            ].map(({ key, label, placeholder, type = "text" }) => (
              <div key={key}>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>{label}</label>
                <input
                  type={type}
                  value={fields[key as keyof typeof fields]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  required
                  className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
                  style={fieldStyle}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
                />
              </div>
            ))}
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Difficulty *</label>
              <select
                value={fields.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className="font-body text-off-white focus:outline-none"
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value} style={{ background: "#111111" }}>{d.label} — Lv.{d.level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Status</label>
              <select
                value={fields.status}
                onChange={(e) => set("status", e.target.value)}
                className="font-body text-off-white focus:outline-none"
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                {EXPEDITION_STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#111111" }}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Description</label>
            <textarea
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ ...fieldStyle, lineHeight: 1.6 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editRequiresApproval}
                onChange={(e) => setEditRequiresApproval(e.target.checked)}
                style={{ accentColor: "#9BFF3C", width: "14px", height: "14px" }}
              />
              <span className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.12em" }}>
                Require leader approval before joining
              </span>
            </label>
          </div>
          {editRequiresApproval && (
            <div style={{ marginBottom: "12px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Question for applicants</label>
              <textarea
                value={fields.application_prompt}
                onChange={(e) => set("application_prompt", e.target.value)}
                rows={2}
                placeholder="e.g. Why do you want to join?"
                className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
                style={{ ...fieldStyle, lineHeight: 1.6 }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
              />
            </div>
          )}
          {fields.location && (
            <div style={{ marginBottom: "12px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "6px" }}>Map preview</label>
              <ExpeditionMapClient location={fields.location} />
            </div>
          )}
          <div style={{ marginBottom: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "6px" }}>Cover image</label>
            <ImageUpload folder="expeditions" currentUrl={imageUrl} onUpload={setImageUrl} />
          </div>
          {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.75rem", marginBottom: "10px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={loading} className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50" style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "8px 18px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "SAVING..." : "SAVE"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="font-body text-muted-ink hover:text-off-white transition-colors duration-150" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem" }}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    );
  }

  async function toggleFeatured() {
    setFeatLoading(true);
    const res = await fetch(`/api/admin/expeditions/${expedition.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expedition, featured: !featured }),
    });
    if (res.ok) setFeatured((f) => !f);
    setFeatLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <button
        onClick={() => setEditing(true)}
        style={{ ...BTN.base, background: "rgba(155,255,60,0.1)", color: "#9BFF3C", border: "1px solid rgba(155,255,60,0.3)" }}
      >
        EDIT
      </button>
      <button
        disabled={featLoading}
        onClick={toggleFeatured}
        style={{ ...BTN.base, background: featured ? "#9BFF3C" : "transparent", color: featured ? "#111111" : "#8B7355", border: "1px solid rgba(155,255,60,0.3)" }}
      >
        {featLoading ? "…" : featured ? "★ FEATURED" : "☆ FEATURE"}
      </button>
      <button
        disabled={loading}
        onClick={del}
        style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}
      >
        {loading ? "…" : "DELETE"}
      </button>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "8px 0",
  fontSize: "0.88rem",
  color: "#F0EDEA",
  width: "100%",
  fontFamily: "inherit",
};

export function AdminExpeditionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [fields, setFields] = useState({
    name: "",
    location: "",
    difficulty: "Moderate",
    price: "",
    date_start: "",
    date_end: "",
    quota_max: "",
    leader_handle: "",
    description: "",
    application_prompt: "",
  });

  function set(key: string, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/expeditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, image_url: imageUrl, requires_approval: requiresApproval }),
    });
    const json = await res.json();

    if (res.ok) {
      setFields({ name: "", location: "", difficulty: "Moderate", price: "", date_start: "", date_end: "", quota_max: "", leader_handle: "", description: "", application_prompt: "" });
      setRequiresApproval(false);
      setImageUrl("");
      setOpen(false);
      router.refresh();
    } else {
      setError(json.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150"
        style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "10px 20px", border: "none", cursor: "pointer", marginBottom: "20px" }}
      >
        + NEW EXPEDITION
      </button>
    );
  }

  return (
    <div
      style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.5)", padding: "28px", marginBottom: "24px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>
          NEW EXPEDITION
        </p>
        <button
          onClick={() => setOpen(false)}
          className="font-body text-muted-ink hover:text-off-white transition-colors duration-150"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
        >
          CANCEL
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          {[
            { key: "name", label: "Name *", placeholder: "Mount Rinjani Circuit" },
            { key: "location", label: "Location *", placeholder: "Lombok, Indonesia" },
            { key: "price", label: "Price *", placeholder: "Rp 2.500.000" },
            { key: "leader_handle", label: "Leader handle *", placeholder: "@username" },
            { key: "quota_max", label: "Quota *", placeholder: "12", type: "number" },
            { key: "date_start", label: "Date start *", type: "date" },
            { key: "date_end", label: "Date end *", type: "date" },
          ].map(({ key, label, placeholder, type = "text" }) => (
            <div key={key}>
              <label
                className="font-body font-semibold text-muted-ink uppercase block"
                style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}
              >
                {label}
              </label>
              <input
                type={type}
                value={fields[key as keyof typeof fields]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                required
                className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
                style={fieldStyle}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
              />
            </div>
          ))}

          <div>
            <label
              className="font-body font-semibold text-muted-ink uppercase block"
              style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}
            >
              Difficulty *
            </label>
            <select
              value={fields.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
              className="font-body text-off-white focus:outline-none"
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value} style={{ background: "#111111" }}>
                  {d.label} — Lv.{d.level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            className="font-body font-semibold text-muted-ink uppercase block"
            style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}
          >
            Description (optional)
          </label>
          <textarea
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="What's the trip about? Terrain, vibe, what to expect..."
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
            style={{ ...fieldStyle, lineHeight: 1.6 }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              style={{ accentColor: "#9BFF3C", width: "14px", height: "14px" }}
            />
            <span className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.12em" }}>
              Require leader approval before joining
            </span>
          </label>
        </div>

        {requiresApproval && (
          <div style={{ marginBottom: "16px" }}>
            <label
              className="font-body font-semibold text-muted-ink uppercase block"
              style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}
            >
              Question for applicants (optional)
            </label>
            <textarea
              value={fields.application_prompt}
              onChange={(e) => set("application_prompt", e.target.value)}
              rows={2}
              placeholder="e.g. Why do you want to join this expedition?"
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none"
              style={{ ...fieldStyle, lineHeight: 1.6 }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            className="font-body font-semibold text-muted-ink uppercase block"
            style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "8px" }}
          >
            Cover image (optional)
          </label>
          <ImageUpload folder="expeditions" currentUrl={imageUrl} onUpload={setImageUrl} />
        </div>

        {error && (
          <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem", marginBottom: "12px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
          style={{ fontSize: "0.7rem", letterSpacing: "0.12em", padding: "10px 24px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "CREATING..." : "CREATE EXPEDITION"}
        </button>
      </form>
    </div>
  );
}

export function StoryModerationActions({ id, initialFeatured = false }: { id: string; initialFeatured?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [featLoading, setFeatLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [featured, setFeatured] = useState(initialFeatured);

  async function moderate(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setDone(action === "approve" ? "APPROVED" : "REJECTED");
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  async function toggleFeatured() {
    setFeatLoading(true);
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    if (res.ok) setFeatured((f) => !f);
    setFeatLoading(false);
  }

  async function del() {
    if (!confirm("Delete this story permanently?")) return;
    setLoading(true);
    await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (done) {
    return (
      <span
        style={{ fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 700, padding: "3px 8px", background: done === "APPROVED" ? "#9BFF3C" : "#FF6B1A", color: "#111111" }}
      >
        {done}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
      <button
        disabled={loading}
        onClick={() => moderate("approve")}
        style={{ ...BTN.base, background: "#9BFF3C", color: "#111111" }}
      >
        APPROVE
      </button>
      <button
        disabled={loading}
        onClick={() => moderate("reject")}
        style={{ ...BTN.base, background: "rgba(255,107,26,0.15)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}
      >
        REJECT
      </button>
      <button
        disabled={featLoading}
        onClick={toggleFeatured}
        style={{ ...BTN.base, background: featured ? "#9BFF3C" : "transparent", color: featured ? "#111111" : "#8B7355", border: "1px solid rgba(155,255,60,0.3)" }}
      >
        {featLoading ? "…" : featured ? "★" : "☆"}
      </button>
      <button
        disabled={loading}
        onClick={del}
        style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}
      >
        DELETE
      </button>
    </div>
  );
}

export function AdminExportButtons() {
  function download(type: string) {
    window.location.href = `/api/admin/export?type=${type}`;
  }
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {[
        { type: "members", label: "EXPEDITION MEMBERS" },
        { type: "subscribers", label: "NEWSLETTER SUBSCRIBERS" },
        { type: "users", label: "ALL USERS" },
      ].map(({ type, label }) => (
        <button
          key={type}
          onClick={() => download(type)}
          style={{ ...BTN.base, background: "#1a1a1a", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", padding: "10px 20px" }}
        >
          ↓ {label} CSV
        </button>
      ))}
    </div>
  );
}

export function AdminAutoStatusButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/admin/auto-status", { method: "POST" });
    if (res.ok) {
      const { updated } = await res.json();
      setResult(`Updated: ${updated.ongoing} → ongoing, ${updated.completed} → completed`);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <button
        onClick={run}
        disabled={loading}
        style={{ ...BTN.base, background: loading ? "#1a1a1a" : "#FF6B1A", color: "#111111", padding: "10px 22px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "UPDATING..." : "AUTO-UPDATE STATUS"}
      </button>
      {result && (
        <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{result}</span>
      )}
    </div>
  );
}

export function AdminRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/admin/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    if (res.ok) {
      const { sent, expeditions } = await res.json();
      setResult(`Sent ${sent} reminders across ${expeditions} expedition(s) departing in ${days}d`);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <select
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="font-body text-off-white"
        style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.72rem", color: "#F0EDEA" }}
      >
        {[1, 3, 7, 14].map((d) => <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""} before</option>)}
      </select>
      <button
        onClick={run}
        disabled={loading}
        style={{ ...BTN.base, background: loading ? "#1a1a1a" : "#9BFF3C", color: "#111111", padding: "10px 22px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "SENDING..." : "SEND REMINDERS"}
      </button>
      {result && <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{result}</span>}
    </div>
  );
}

export function AdminUsersSection() {
  const [users, setUsers] = useState<{ id: string; username: string; created_at: string; is_admin: boolean; is_banned: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then(({ users: u }) => {
      setUsers(u ?? []);
      setLoading(false);
    });
    // Get current user id for self-guard
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.id) setCurrentUserId(d.id);
    }).catch(() => {});
  }, []);

  async function doAction(userId: string, action: "ban" | "unban" | "promote" | "demote") {
    setActionLoading(`${userId}:${action}`);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          is_banned: action === "ban" ? true : action === "unban" ? false : u.is_banned,
          is_admin: action === "promote" ? true : action === "demote" ? false : u.is_admin,
        };
      }));
    }
    setActionLoading(null);
  }

  const filtered = users.filter((u) => !search || u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search username..."
        className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
        style={{ background: "transparent", border: "none", borderBottom: "2px solid #4A3B2A", padding: "8px 0", fontSize: "0.85rem", color: "#F0EDEA", width: "240px", marginBottom: "16px" }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
      />
      {loading ? (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filtered.slice(0, 50).map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: u.is_banned ? "rgba(127,0,0,0.08)" : "#1a1a1a", border: `1px solid ${u.is_banned ? "rgba(255,107,26,0.25)" : "rgba(74,59,42,0.25)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <a href={`/u/${u.username}`} className="font-body font-semibold text-off-white hover:text-neon-green transition-colors" style={{ fontSize: "0.8rem" }}>
                    @{u.username}
                  </a>
                  {u.is_admin && <span className="font-body font-semibold" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", padding: "2px 6px", background: "#FF6B1A", color: "#111111" }}>ADMIN</span>}
                  {u.is_banned && <span className="font-body font-semibold" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", padding: "2px 6px", background: "rgba(255,60,60,0.2)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}>🚫 BANNED</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginRight: "6px" }}>
                    {new Date(u.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {!isSelf && (
                    <>
                      <button
                        disabled={!!actionLoading}
                        onClick={() => doAction(u.id, u.is_banned ? "unban" : "ban")}
                        style={{ ...BTN.base, background: u.is_banned ? "rgba(155,255,60,0.1)" : "rgba(255,60,60,0.1)", color: u.is_banned ? "#9BFF3C" : "#FF6B1A", border: `1px solid ${u.is_banned ? "rgba(155,255,60,0.3)" : "rgba(255,107,26,0.4)"}` }}
                      >
                        {actionLoading === `${u.id}:${u.is_banned ? "unban" : "ban"}` ? "…" : u.is_banned ? "UNBAN" : "BAN"}
                      </button>
                      <button
                        disabled={!!actionLoading}
                        onClick={() => doAction(u.id, u.is_admin ? "demote" : "promote")}
                        style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}
                      >
                        {actionLoading === `${u.id}:${u.is_admin ? "demote" : "promote"}` ? "…" : u.is_admin ? "DEMOTE" : "PROMOTE"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length > 50 && (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", paddingTop: "8px" }}>Showing 50 of {filtered.length} users.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReportsSection() {
  const [reports, setReports] = useState<{ id: string; content_type: string; content_id: string; reason: string; created_at: string; resolved: boolean; profiles: { username: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports").then((r) => r.json()).then(({ reports: r }) => {
      setReports(r ?? []);
      setLoading(false);
    });
  }, []);

  async function resolve(id: string) {
    await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, resolved: true } : r));
  }

  const open = reports.filter((r) => !r.resolved);
  const closed = reports.filter((r) => r.resolved);

  return loading ? (
    <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>
  ) : !reports.length ? (
    <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>No reports.</p>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {[...open, ...closed].slice(0, 50).map((r) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", background: "#1a1a1a", border: `1px solid ${r.resolved ? "rgba(74,59,42,0.2)" : "rgba(255,107,26,0.3)"}`, opacity: r.resolved ? 0.5 : 1 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                <span className="font-body font-semibold" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "2px 7px", background: "rgba(255,107,26,0.15)", color: "#FF6B1A" }}>
                  {r.content_type.toUpperCase()}
                </span>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem" }}>
                  by @{p?.username ?? "unknown"}
                </span>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>
                  {new Date(r.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="font-body text-off-white" style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{r.reason}</p>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", marginTop: "2px", fontFamily: "monospace" }}>ID: {r.content_id}</p>
            </div>
            {!r.resolved && (
              <button onClick={() => resolve(r.id)} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "6px 12px", flexShrink: 0 }}>
                RESOLVE
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GalleryModerationActions({ id, initialStatus }: { id: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function setPhotoStatus(next: "approved" | "rejected") {
    setLoading(true);
    await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this photo permanently?")) return;
    setLoading(true);
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 700, padding: "3px 8px", background: status === "approved" ? "#9BFF3C" : status === "rejected" ? "#FF6B1A" : "rgba(74,59,42,0.4)", color: status === "pending" ? "#8B7355" : "#111111" }}>
        {status.toUpperCase()}
      </span>
      {status !== "approved" && (
        <button disabled={loading} onClick={() => setPhotoStatus("approved")} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111" }}>APPROVE</button>
      )}
      {status !== "rejected" && (
        <button disabled={loading} onClick={() => setPhotoStatus("rejected")} style={{ ...BTN.base, background: "rgba(255,107,26,0.15)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}>REJECT</button>
      )}
      <button disabled={loading} onClick={del} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>DELETE</button>
    </div>
  );
}
