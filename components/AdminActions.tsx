"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  const [error, setError] = useState("");

  async function setModStatus(next: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/chaos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Action failed");
    }
    setLoading(false);
  }

  async function del() {
    if (!confirm("Delete this chaos card?")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/chaos/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed");
      setLoading(false);
    }
  }

  return (
    <div>
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
    {error && <p className="font-body" style={{ fontSize: "0.65rem", color: "#FF6B1A", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export function ExpeditionDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function del() {
    if (!confirm("Delete this expedition and all its members?")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/expeditions/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        disabled={loading}
        onClick={del}
        style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}
      >
        {loading ? "…" : "DELETE"}
      </button>
      {error && <p className="font-body" style={{ fontSize: "0.65rem", color: "#FF6B1A", marginTop: "4px" }}>{error}</p>}
    </div>
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
  leader_id: string;
  profiles?: { username: string } | { username: string }[] | null;
  image_url?: string | null;
  description?: string | null;
  status?: string | null;
  requires_approval?: boolean | null;
  application_prompt?: string | null;
  featured?: boolean | null;
  activity_category?: string | null;
  destination_id?: string | null;
  payment_policy?: string | null;
  payment_deadline_policy?: string | null;
  payment_deadline_value?: number | null;
  seat_reservation_policy?: string | null;
  seat_reservation_hours?: number | null;
  refund_policy?: string | null;
  cancellation_policy?: string | null;
  payment_instructions?: string | null;
  accepted_payment_methods?: string[] | null;
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
  const [editPaymentPolicy, setEditPaymentPolicy] = useState(expedition.payment_policy ?? "fixed_price");
  const [editPaymentDeadlinePolicy, setEditPaymentDeadlinePolicy] = useState(expedition.payment_deadline_policy ?? "hours");
  const [editPaymentDeadlineValue, setEditPaymentDeadlineValue] = useState(expedition.payment_deadline_value ?? 24);
  const [editSeatReservationPolicy, setEditSeatReservationPolicy] = useState(expedition.seat_reservation_policy ?? "immediate");
  const [editSeatReservationHours, setEditSeatReservationHours] = useState(expedition.seat_reservation_hours ?? 0);
  const [editRefundPolicy, setEditRefundPolicy] = useState(expedition.refund_policy ?? "");
  const [editCancellationPolicy, setEditCancellationPolicy] = useState(expedition.cancellation_policy ?? "");
  const [editPaymentInstructions, setEditPaymentInstructions] = useState(expedition.payment_instructions ?? "");
  const [editAcceptedPaymentMethods, setEditAcceptedPaymentMethods] = useState<string[]>(expedition.accepted_payment_methods ?? ["bank_transfer"]);
  const [adminUsers, setAdminUsers] = useState<{ id: string; username: string }[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
  const [destinationId, setDestinationId] = useState(expedition.destination_id ?? "");
  const [fields, setFields] = useState({
    name: expedition.name,
    location: expedition.location,
    difficulty: expedition.difficulty,
    price: expedition.price,
    date_start: expedition.date_start?.slice(0, 10) ?? "",
    date_end: expedition.date_end?.slice(0, 10) ?? "",
    quota_max: String(expedition.quota_max),
    leader_handle: (Array.isArray(expedition.profiles) ? expedition.profiles[0]?.username : (expedition.profiles as { username: string } | null)?.username) ?? "",
    description: expedition.description ?? "",
    application_prompt: expedition.application_prompt ?? "",
    status: expedition.status ?? "upcoming",
    activity_category: expedition.activity_category ?? "Other",
  });

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(({ users }) => setAdminUsers((users ?? []).filter((u: { is_admin: boolean }) => u.is_admin)));
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then(({ activities: a }) => setActivities((a ?? []).filter((x: { archived: boolean }) => !x.archived).map((x: { name: string }) => x.name)));
    fetch("/api/admin/destinations")
      .then((r) => r.json())
      .then(({ destinations: d }) => setDestinations(d ?? []));
  }, []);

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
      body: JSON.stringify({ ...fields, image_url: imageUrl, requires_approval: editRequiresApproval, destination_id: destinationId || null, payment_policy: editPaymentPolicy, payment_deadline_policy: editPaymentDeadlinePolicy, payment_deadline_value: editPaymentDeadlineValue, seat_reservation_policy: editSeatReservationPolicy, seat_reservation_hours: editSeatReservationHours, refund_policy: editRefundPolicy, cancellation_policy: editCancellationPolicy, payment_instructions: editPaymentInstructions, accepted_payment_methods: editAcceptedPaymentMethods }),
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
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Leader *</label>
              <select
                value={fields.leader_handle}
                onChange={(e) => set("leader_handle", e.target.value)}
                required
                className="font-body text-off-white focus:outline-none"
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                <option value="">— Select leader —</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.username} style={{ background: "#111111" }}>@{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Quota *</label>
              <input
                type="number"
                value={fields.quota_max}
                onChange={(e) => set("quota_max", e.target.value)}
                placeholder="12"
                min={3}
                required
                className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
                style={fieldStyle}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
              />
              <span className="font-body" style={{ fontSize: "0.52rem", color: "#8B7355" }}>Min. 3 orang</span>
            </div>
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
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Activity *</label>
              <select
                value={fields.activity_category}
                onChange={(e) => set("activity_category", e.target.value)}
                className="font-body text-off-white focus:outline-none"
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                {/* ponytail: inject archived value so controlled select always has a matching option */}
                {(activities.includes(fields.activity_category) ? activities : [...activities, fields.activity_category]).map((c) => (
                  <option key={c} value={c} style={{ background: "#111111" }}>{c}</option>
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
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Destination</label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="font-body text-off-white focus:outline-none"
                style={{ ...fieldStyle, cursor: "pointer" }}
              >
                <option value="">— None —</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#111111" }}>{d.name}</option>
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
          <div style={{ margin: "20px 0 12px", borderTop: "1px solid rgba(74,59,42,0.4)", paddingTop: "12px" }}>
            <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.65rem", letterSpacing: "0.08em", marginBottom: "10px" }}>Payment Policy</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Policy Type</label>
                <select value={editPaymentPolicy} onChange={(e) => setEditPaymentPolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                  <option value="free" style={{ background: "#111111" }}>Free</option>
                  <option value="fixed_price" style={{ background: "#111111" }}>Fixed Price</option>
                  <option value="donation" style={{ background: "#111111" }}>Donation</option>
                </select>
              </div>
              <div>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Deadline</label>
                <select value={editPaymentDeadlinePolicy} onChange={(e) => setEditPaymentDeadlinePolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                  <option value="none" style={{ background: "#111111" }}>No Deadline</option>
                  <option value="hours" style={{ background: "#111111" }}>Hours After</option>
                  <option value="days" style={{ background: "#111111" }}>Days After</option>
                </select>
              </div>
              {editPaymentDeadlinePolicy !== "none" && (
                <div>
                  <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Deadline Value</label>
                  <input type="number" value={editPaymentDeadlineValue} onChange={(e) => setEditPaymentDeadlineValue(Number(e.target.value))} min={1} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                </div>
              )}
              <div>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Seat Reservation</label>
                <select value={editSeatReservationPolicy} onChange={(e) => setEditSeatReservationPolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                  <option value="immediate" style={{ background: "#111111" }}>Immediate</option>
                  <option value="after_payment" style={{ background: "#111111" }}>After Payment</option>
                  <option value="temporary" style={{ background: "#111111" }}>Temporary Hold</option>
                </select>
              </div>
              {editSeatReservationPolicy === "temporary" && (
                <div>
                  <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Hold Duration (hours)</label>
                  <input type="number" value={editSeatReservationHours} onChange={(e) => setEditSeatReservationHours(Number(e.target.value))} min={1} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                </div>
              )}
            </div>
            <div style={{ marginTop: "10px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Accepted Payment Methods</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["bank_transfer", "qris", "e_wallet"].map((m) => (
                  <label key={m} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.65rem", color: "#8B7355" }}>
                    <input type="checkbox" checked={editAcceptedPaymentMethods.includes(m)} onChange={() => setEditAcceptedPaymentMethods((prev) => prev.includes(m) ? prev.filter((x: string) => x !== m) : [...prev, m])} style={{ accentColor: "#9BFF3C" }} />
                    {m === "bank_transfer" ? "Bank Transfer" : m === "qris" ? "QRIS" : "E-Wallet"}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Payment Instructions</label>
              <textarea value={editPaymentInstructions} onChange={(e) => setEditPaymentInstructions(e.target.value)} rows={2} placeholder="e.g. Transfer to BCA 123456 a.n. Vakansisme" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none" style={{ ...fieldStyle, lineHeight: 1.6 }} />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Refund Policy</label>
              <input type="text" value={editRefundPolicy} onChange={(e) => setEditRefundPolicy(e.target.value)} placeholder="e.g. Full refund 7 days before departure" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
            </div>
            <div style={{ marginTop: "10px" }}>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Cancellation Policy</label>
              <input type="text" value={editCancellationPolicy} onChange={(e) => setEditCancellationPolicy(e.target.value)} placeholder="e.g. Free cancellation up to 48 hours before" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
            </div>
          </div>
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
  const [adminUsers, setAdminUsers] = useState<{ id: string; username: string }[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);
  const [destinationId, setDestinationId] = useState("");
  const [paymentPolicy, setPaymentPolicy] = useState("fixed_price");
  const [paymentDeadlinePolicy, setPaymentDeadlinePolicy] = useState("hours");
  const [paymentDeadlineValue, setPaymentDeadlineValue] = useState(24);
  const [seatReservationPolicy, setSeatReservationPolicy] = useState("immediate");
  const [seatReservationHours, setSeatReservationHours] = useState(0);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState(["bank_transfer"]);
  const [fields, setFields] = useState({
    name: "",
    location: "",
    difficulty: "Moderate",
    activity_category: "Other",
    price: "",
    date_start: "",
    date_end: "",
    quota_max: "",
    leader_handle: "",
    description: "",
    application_prompt: "",
  });

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(({ users }) => setAdminUsers((users ?? []).filter((u: { is_admin: boolean }) => u.is_admin)));
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then(({ activities: a }) => setActivities((a ?? []).filter((x: { archived: boolean }) => !x.archived).map((x: { name: string }) => x.name)));
    fetch("/api/admin/destinations")
      .then((r) => r.json())
      .then(({ destinations: d }) => setDestinations(d ?? []));
  }, []);

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
      body: JSON.stringify({ ...fields, image_url: imageUrl, requires_approval: requiresApproval, destination_id: destinationId || null, payment_policy: paymentPolicy, payment_deadline_policy: paymentDeadlinePolicy, payment_deadline_value: paymentDeadlineValue, seat_reservation_policy: seatReservationPolicy, seat_reservation_hours: seatReservationHours, refund_policy: refundPolicy, cancellation_policy: cancellationPolicy, payment_instructions: paymentInstructions, accepted_payment_methods: acceptedPaymentMethods }),
    });
    const json = await res.json();

    if (res.ok) {
      setFields({ name: "", location: "", difficulty: "Moderate", activity_category: "Other", price: "", date_start: "", date_end: "", quota_max: "", leader_handle: "", description: "", application_prompt: "" });
      setRequiresApproval(false);
      setImageUrl("");
      setDestinationId("");
      setPaymentPolicy("fixed_price");
      setPaymentDeadlinePolicy("hours");
      setPaymentDeadlineValue(24);
      setSeatReservationPolicy("immediate");
      setSeatReservationHours(0);
      setRefundPolicy("");
      setCancellationPolicy("");
      setPaymentInstructions("");
      setAcceptedPaymentMethods(["bank_transfer"]);
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
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
              Leader *
            </label>
            <select
              value={fields.leader_handle}
              onChange={(e) => set("leader_handle", e.target.value)}
              required
              className="font-body text-off-white focus:outline-none"
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              <option value="">— Select leader —</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.username} style={{ background: "#111111" }}>@{u.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
              Quota *
            </label>
            <input
              type="number"
              value={fields.quota_max}
              onChange={(e) => set("quota_max", e.target.value)}
              placeholder="12"
              min={3}
              required
              className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
            />
            <span className="font-body" style={{ fontSize: "0.52rem", color: "#8B7355" }}>Min. 3 orang</span>
          </div>

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

          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
              Activity *
            </label>
            <select
              value={fields.activity_category}
              onChange={(e) => set("activity_category", e.target.value)}
              className="font-body text-off-white focus:outline-none"
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              {/* ponytail: inject archived value so controlled select always has a matching option */}
              {(activities.includes(fields.activity_category) ? activities : [...activities, fields.activity_category]).map((c) => (
                <option key={c} value={c} style={{ background: "#111111" }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>
              Destination
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="font-body text-off-white focus:outline-none"
              style={{ ...fieldStyle, cursor: "pointer" }}
            >
              <option value="">— None —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id} style={{ background: "#111111" }}>{d.name}</option>
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

        <div style={{ margin: "24px 0 12px", borderTop: "1px solid rgba(74,59,42,0.4)", paddingTop: "16px" }}>
          <p className="font-display font-bold uppercase text-off-white" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", marginBottom: "12px" }}>Payment Policy</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Policy Type</label>
              <select value={paymentPolicy} onChange={(e) => setPaymentPolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="free" style={{ background: "#111111" }}>Free</option>
                <option value="fixed_price" style={{ background: "#111111" }}>Fixed Price</option>
                <option value="donation" style={{ background: "#111111" }}>Donation</option>
              </select>
            </div>
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Deadline</label>
              <select value={paymentDeadlinePolicy} onChange={(e) => setPaymentDeadlinePolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="none" style={{ background: "#111111" }}>No Deadline</option>
                <option value="hours" style={{ background: "#111111" }}>Hours After</option>
                <option value="days" style={{ background: "#111111" }}>Days After</option>
              </select>
            </div>
            {paymentDeadlinePolicy !== "none" && (
              <div>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Deadline Value</label>
                <input type="number" value={paymentDeadlineValue} onChange={(e) => setPaymentDeadlineValue(Number(e.target.value))} min={1} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
              </div>
            )}
            <div>
              <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Seat Reservation</label>
              <select value={seatReservationPolicy} onChange={(e) => setSeatReservationPolicy(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="immediate" style={{ background: "#111111" }}>Immediate</option>
                <option value="after_payment" style={{ background: "#111111" }}>After Payment</option>
                <option value="temporary" style={{ background: "#111111" }}>Temporary Hold</option>
              </select>
            </div>
            {seatReservationPolicy === "temporary" && (
              <div>
                <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Hold Duration (hours)</label>
                <input type="number" value={seatReservationHours} onChange={(e) => setSeatReservationHours(Number(e.target.value))} min={1} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
              </div>
            )}
          </div>
          <div style={{ marginTop: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Accepted Payment Methods</label>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {["bank_transfer", "qris", "e_wallet"].map((m) => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.7rem", color: "#8B7355" }}>
                  <input type="checkbox" checked={acceptedPaymentMethods.includes(m)} onChange={() => setAcceptedPaymentMethods((prev) => prev.includes(m) ? prev.filter((x: string) => x !== m) : [...prev, m])} style={{ accentColor: "#9BFF3C" }} />
                  {m === "bank_transfer" ? "Bank Transfer" : m === "qris" ? "QRIS" : "E-Wallet"}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Payment Instructions (shown to users)</label>
            <textarea value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} rows={2} placeholder="e.g. Transfer to BCA 123456 a.n. Vakansisme" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none" style={{ ...fieldStyle, lineHeight: 1.6 }} />
          </div>
          <div style={{ marginTop: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Refund Policy</label>
            <input type="text" value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} placeholder="e.g. Full refund 7 days before departure" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
          </div>
          <div style={{ marginTop: "12px" }}>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Cancellation Policy</label>
            <input type="text" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} placeholder="e.g. Free cancellation up to 48 hours before" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
          </div>
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

export function StoryModerationActions({ id, initialFeatured = false }: { id: string; initialFeatured?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [featLoading, setFeatLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [featured, setFeatured] = useState(initialFeatured);
  const [error, setError] = useState("");

  async function moderate(action: "approve" | "reject") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setDone(action === "approve" ? "APPROVED" : "REJECTED");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Action failed");
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
    setError("");
    const res = await fetch(`/api/admin/stories/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed");
      setLoading(false);
    }
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
    <div>
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
      {error && <p className="font-body" style={{ fontSize: "0.65rem", color: "#FF6B1A", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export function AdminExportButtons() {
  function download(type: string) {
    // eslint-disable-next-line react-hooks/immutability
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
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auto-status", { method: "POST" });
    if (res.ok) {
      const { updated } = await res.json();
      setResult(`Updated: ${updated.ongoing} → ongoing, ${updated.completed} → completed`);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Auto-update failed");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
      <button
        onClick={run}
        disabled={loading}
        style={{ ...BTN.base, background: loading ? "#1a1a1a" : "#FF6B1A", color: "#111111", padding: "10px 22px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "UPDATING..." : "AUTO-UPDATE STATUS"}
      </button>
      {result && <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{result}</span>}
      {error && <span className="font-body" style={{ fontSize: "0.72rem", color: "#FF6B1A" }}>{error}</span>}
    </div>
  );
}

export function AdminRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [tripId, setTripId] = useState("");
  const [trips, setTrips] = useState<{ id: string; name: string; date_start: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/reminders")
      .then((r) => r.json())
      .then((json) => setTrips(json.expeditions ?? []))
      .catch(() => {});
  }, []);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/admin/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripId ? { expeditionId: tripId } : { days }),
    });
    if (res.ok) {
      const { sent, expeditions } = await res.json();
      setResult(
        tripId
          ? `Sent ${sent} reminder(s) for the selected trip`
          : `Sent ${sent} reminders across ${expeditions} expedition(s) departing in ${days}d`
      );
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to send reminders");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <select
        value={days}
        onChange={(e) => { setDays(Number(e.target.value)); setTripId(""); }}
        disabled={!!tripId}
        className="font-body text-off-white"
        style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.72rem", color: "#F0EDEA", opacity: tripId ? 0.4 : 1 }}
      >
        {[1, 3, 7, 14].map((d) => <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""} before</option>)}
      </select>
      <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>OR</span>
      <select
        value={tripId}
        onChange={(e) => setTripId(e.target.value)}
        className="font-body text-off-white"
        style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.72rem", color: "#F0EDEA", maxWidth: "260px" }}
      >
        <option value="">— Pick a specific trip —</option>
        {trips.map((t) => (
          <option key={t.id} value={t.id}>{t.name} ({new Date(t.date_start).toLocaleDateString("en", { day: "numeric", month: "short" })})</option>
        ))}
      </select>
      <button
        onClick={run}
        disabled={loading}
        style={{ ...BTN.base, background: loading ? "#1a1a1a" : "#9BFF3C", color: "#111111", padding: "10px 22px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "SENDING..." : "SEND REMINDERS"}
      </button>
      {result && <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{result}</span>}
      {error && <span className="font-body" style={{ fontSize: "0.72rem", color: "#FF6B1A" }}>{error}</span>}
    </div>
  );
}

export function AdminPaymentRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [tripId, setTripId] = useState("");
  const [trips, setTrips] = useState<{ id: string; name: string; date_start: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/reminders")
      .then((r) => r.json())
      .then((json) => setTrips(json.expeditions ?? []))
      .catch(() => {});
  }, []);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/admin/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment", ...(tripId ? { expeditionId: tripId } : { days }) }),
    });
    if (res.ok) {
      const { sent, expeditions } = await res.json();
      setResult(
        tripId
          ? `Sent ${sent} payment reminder(s) for the selected trip`
          : `Sent ${sent} payment reminders across ${expeditions} expedition(s) departing in ${days}d`
      );
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to send payment reminders");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <select
        value={days}
        onChange={(e) => { setDays(Number(e.target.value)); setTripId(""); }}
        disabled={!!tripId}
        className="font-body text-off-white"
        style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.72rem", color: "#F0EDEA", opacity: tripId ? 0.4 : 1 }}
      >
        {[1, 3, 7, 14].map((d) => <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""} before</option>)}
      </select>
      <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem" }}>OR</span>
      <select
        value={tripId}
        onChange={(e) => setTripId(e.target.value)}
        className="font-body text-off-white"
        style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.72rem", color: "#F0EDEA", maxWidth: "260px" }}
      >
        <option value="">— Pick a specific trip —</option>
        {trips.map((t) => (
          <option key={t.id} value={t.id}>{t.name} ({new Date(t.date_start).toLocaleDateString("en", { day: "numeric", month: "short" })})</option>
        ))}
      </select>
      <button
        onClick={run}
        disabled={loading}
        style={{ ...BTN.base, background: loading ? "#1a1a1a" : "#FF6B1A", color: "#111111", padding: "10px 22px", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "SENDING..." : "SEND PAYMENT REMINDERS"}
      </button>
      {result && <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{result}</span>}
      {error && <span className="font-body" style={{ fontSize: "0.72rem", color: "#FF6B1A" }}>{error}</span>}
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
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Action failed");
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
    const res = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, resolved: true } : r));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Failed to resolve report");
    }
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
  const [error, setError] = useState("");

  async function setPhotoStatus(next: "approved" | "rejected") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Action failed");
    }
    setLoading(false);
  }

  async function del() {
    if (!confirm("Delete this photo permanently?")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Delete failed");
      setLoading(false);
    }
  }

  return (
    <div>
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
      {error && <p className="font-body" style={{ fontSize: "0.65rem", color: "#FF6B1A", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

type Proposal = {
  id: string;
  proposer_handle: string;
  name: string;
  location: string;
  difficulty: string;
  price: string;
  date_start: string;
  date_end: string;
  quota_max: number;
  description: string | null;
  image_url: string | null;
  requires_approval: boolean;
  created_at: string;
};

export function ProposalModerationActions({ proposal, onDone }: { proposal: Proposal; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch(`/api/admin/expeditions/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, admin_note: note }),
    });
    if (res.ok) {
      setDone(action === "approve" ? "APPROVED" : "REJECTED");
      if (onDone) onDone();
      else window.location.href = "/admin/proposals";
    }
    setLoading(false);
  }

  if (done) {
    return (
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 700, padding: "3px 8px", background: done === "APPROVED" ? "#9BFF3C" : "#FF6B1A", color: "#111111" }}>
        {done}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", flexWrap: "wrap" }}>
      <button disabled={loading} onClick={() => act("approve")} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111" }}>APPROVE</button>
      {rejecting ? (
        <>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="font-body text-off-white placeholder:text-muted-ink focus:outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "4px 10px", fontSize: "0.72rem", color: "#F0EDEA", width: "220px" }}
          />
          <button disabled={loading} onClick={() => act("reject")} style={{ ...BTN.base, background: "rgba(255,107,26,0.15)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}>CONFIRM REJECT</button>
          <button onClick={() => setRejecting(false)} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>CANCEL</button>
        </>
      ) : (
        <button disabled={loading} onClick={() => setRejecting(true)} style={{ ...BTN.base, background: "rgba(255,107,26,0.15)", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.4)" }}>REJECT</button>
      )}
    </div>
  );
}

export function AdminProposalsSection() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/expeditions/proposals").then((r) => r.json()).then(({ proposals: p }) => {
      setProposals(p ?? []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  if (loading) return <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>;
  if (!proposals.length) return <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>No pending proposals.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {proposals.map((p) => (
        <div key={p.id} style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", overflow: "hidden" }}>
          {p.image_url && (
            <div style={{ position: "relative", width: "100%", height: "160px" }}>
              <Image src={p.image_url} alt={p.name} fill sizes="640px" className="object-cover" style={{ filter: "brightness(0.85)" }} />
            </div>
          )}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <a href={`/admin/proposals/${p.id}`} className="font-display font-bold uppercase text-off-white hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.9rem", letterSpacing: "-0.01em", marginBottom: "4px", display: "block", textDecoration: "none" }}>{p.name} →</a>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "4px" }}>
                  @{p.proposer_handle} · {p.location} · {p.difficulty} · {p.price} · {p.quota_max} slots
                </p>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "4px" }}>
                  {p.date_start} → {p.date_end}
                  {p.requires_approval && <span style={{ marginLeft: "8px", background: "rgba(155,255,60,0.1)", color: "#9BFF3C", padding: "1px 6px", fontSize: "0.6rem" }}>APPROVAL REQUIRED</span>}
                </p>
                {p.description && (
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginTop: "8px", lineHeight: 1.6 }}>{p.description}</p>
                )}
              </div>
              <span className="font-body text-muted-ink" style={{ fontSize: "0.65rem", flexShrink: 0 }}>{new Date(p.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}</span>
            </div>
            <ProposalModerationActions proposal={p} onDone={load} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminActivitiesSection() {
  const [activities, setActivities] = useState<{ id: string; name: string; archived: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  function load() {
    fetch("/api/admin/activities")
      .then((r) => r.json())
      .then(({ activities: a }) => { setActivities(a ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!newName.trim()) return;
    setAddLoading(true);
    setError("");
    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed"); setAddLoading(false); return; }
    setNewName("");
    setAddLoading(false);
    load();
  }

  async function toggleArchive(id: string, archived: boolean) {
    setActionId(id);
    const res = await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !archived }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to update activity");
    }
    setActionId(null);
    load();
  }

  async function rename(id: string) {
    if (!renameName.trim()) return;
    setActionId(id);
    const res = await fetch(`/api/admin/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to rename"); }
    setRenameId(null);
    setRenameName("");
    setActionId(null);
    load();
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setActionId(id);
    const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to delete"); }
    setActionId(null);
    load();
  }

  if (loading) return <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>;

  const active = activities.filter((a) => !a.archived);
  const archived = activities.filter((a) => a.archived);

  return (
    <div>
      {error && <p className="font-body" style={{ color: "#FF6B1A", fontSize: "0.75rem", marginBottom: "10px" }}>{error}</p>}

      {/* Add form */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New activity name..."
          className="font-body text-off-white"
          style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "8px 12px", fontSize: "0.8rem", flex: 1, outline: "none", color: "#F0EDEA" }}
        />
        <button
          onClick={add}
          disabled={addLoading}
          style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: addLoading ? 0.6 : 1 }}
        >
          ADD
        </button>
      </div>

      {/* Active activities */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
        {active.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.25)" }}>
            {renameId === a.id ? (
              <>
                <input
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && rename(a.id)}
                  className="font-body text-off-white"
                  style={{ background: "transparent", border: "1px solid rgba(155,255,60,0.4)", padding: "4px 8px", fontSize: "0.78rem", flex: 1, outline: "none", color: "#F0EDEA" }}
                  autoFocus
                />
                <button onClick={() => rename(a.id)} disabled={actionId === a.id} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", opacity: actionId === a.id ? 0.5 : 1 }}>SAVE</button>
                <button onClick={() => { setRenameId(null); setRenameName(""); }} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>CANCEL</button>
              </>
            ) : (
              <>
                <span className="font-body text-off-white" style={{ fontSize: "0.82rem", flex: 1 }}>{a.name}</span>
                <button onClick={() => { setRenameId(a.id); setRenameName(a.name); }} disabled={!!actionId} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>RENAME</button>
                <button onClick={() => toggleArchive(a.id, a.archived)} disabled={actionId === a.id} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", opacity: actionId === a.id ? 0.5 : 1 }}>ARCHIVE</button>
                <button onClick={() => del(a.id, a.name)} disabled={!!actionId} style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.3)" }}>DELETE</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", marginBottom: "8px" }}>ARCHIVED ({archived.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {archived.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.25)", opacity: 0.6 }}>
                <span className="font-body text-muted-ink" style={{ fontSize: "0.82rem", flex: 1 }}>{a.name}</span>
                <button onClick={() => toggleArchive(a.id, a.archived)} disabled={actionId === a.id} style={{ ...BTN.base, background: "transparent", color: "#9BFF3C", border: "1px solid rgba(155,255,60,0.3)", opacity: actionId === a.id ? 0.5 : 1 }}>RESTORE</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminReminderTemplate() {
  const [template, setTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((r) => r.json())
      .then((s) => setTemplate(s.reminder_templates?.trip_reminder ?? ""))
      .catch(() => setError("Failed to load template"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminder_templates: { trip_reminder: template },
      }),
    });
    if (!res.ok) setError("Failed to save template");
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading template...</p>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: "56px" }}>
      <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
        REMINDER TEMPLATE
      </h2>

      <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px" }}>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "16px", lineHeight: 1.6 }}>
          Available variables: <code style={{ color: "#9BFF3C", background: "rgba(155,255,60,0.08)", padding: "2px 6px" }}>{`{{name}}`}</code> — member name, <code style={{ color: "#9BFF3C", background: "rgba(155,255,60,0.08)", padding: "2px 6px" }}>{`{{trip}}`}</code> — trip name, <code style={{ color: "#9BFF3C", background: "rgba(155,255,60,0.08)", padding: "2px 6px" }}>{`{{days}}`}</code> — days until departure
        </p>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Halo {{name}}, persiapkan dirimu! {{trip}} akan berangkat {{days}} hari lagi."
          rows={4}
          style={{ ...fieldStyle, border: "2px solid #4A3B2A", padding: "8px", resize: "vertical", width: "100%", marginBottom: "16px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "10px 22px", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "..." : "SIMPAN TEMPLATE"}
          </button>
          {error && <span className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", alignSelf: "center" }}>{error}</span>}
        </div>
      </div>
    </section>
  );
}
