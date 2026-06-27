"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { DIFFICULTIES } from "@/lib/difficulty";

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
};

export function ExpeditionActions({ expedition }: { expedition: ExpeditionData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(expedition.image_url ?? "");
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
      body: JSON.stringify({ ...fields, image_url: imageUrl }),
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

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <button
        onClick={() => setEditing(true)}
        style={{ ...BTN.base, background: "rgba(155,255,60,0.1)", color: "#9BFF3C", border: "1px solid rgba(155,255,60,0.3)" }}
      >
        EDIT
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
      body: JSON.stringify({ ...fields, image_url: imageUrl }),
    });
    const json = await res.json();

    if (res.ok) {
      setFields({ name: "", location: "", difficulty: "Moderate", price: "", date_start: "", date_end: "", quota_max: "", leader_handle: "", description: "" });
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

export function StoryModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

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
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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
        disabled={loading}
        onClick={del}
        style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}
      >
        DELETE
      </button>
    </div>
  );
}
