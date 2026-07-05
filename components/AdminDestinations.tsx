"use client";

import { Fragment, useEffect, useState } from "react";
import { slugify } from "@/lib/seo";
import { kindLabel } from "@/lib/related";

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

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#1a1a1a",
  border: "1px solid rgba(74,59,42,0.35)",
};

const rowStyle: React.CSSProperties = { borderBottom: "1px solid rgba(74,59,42,0.2)" };

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>
      {children}
    </th>
  );
}

function Cell({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className={muted ? "font-body text-muted-ink" : "font-body text-off-white"} style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

type LocationRow = { id: string; type: "province" | "city"; name: string; slug: string | null; parent_id: string | null };
type DestinationRow = {
  id: string;
  kind: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  location_id: string | null;
  elevation_m: number | null;
  description: string | null;
  image_url: string | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "56px" }}>
      <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const DEFAULT_KINDS = ["mountain", "trail", "national_park"];

export default function AdminDestinations() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [kinds, setKinds] = useState<string[]>(DEFAULT_KINDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    Promise.all([
      fetch("/api/admin/locations").then((r) => r.json()),
      fetch("/api/admin/destinations").then((r) => r.json()),
      fetch("/api/admin/kinds").then((r) => r.json()),
    ])
      .then(([locJson, destJson, kindsJson]) => {
        setLocations(locJson.locations ?? []);
        setDestinations(destJson.destinations ?? []);
        if (kindsJson.kinds?.length) setKinds(kindsJson.kinds);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem" }}>Loading...</p>;

  return (
    <div>
      {error && <p className="font-body" style={{ color: "#FF6B1A", fontSize: "0.75rem", marginBottom: "20px" }}>{error}</p>}
      <Section title="LOCATIONS">
        <LocationsSection locations={locations} onError={setError} reload={load} />
      </Section>
      <Section title="DESTINATION KINDS">
        <KindsSection kinds={kinds} destinations={destinations} onError={setError} reload={load} />
      </Section>
      <Section title="DESTINATIONS">
        <DestinationsSection destinations={destinations} locations={locations} kinds={kinds} onError={setError} reload={load} />
      </Section>
    </div>
  );
}

function KindsSection({ kinds, destinations, onError, reload }: { kinds: string[]; destinations: DestinationRow[]; onError: (e: string) => void; reload: () => void }) {
  const [name, setName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionKind, setActionKind] = useState<string | null>(null);

  const inUse = new Set(destinations.map((d) => d.kind));

  async function add() {
    if (!name.trim()) return;
    setAddLoading(true);
    onError("");
    const res = await fetch("/api/admin/kinds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { onError(json.error ?? "Failed to add kind"); setAddLoading(false); return; }
    setName("");
    setAddLoading(false);
    reload();
  }

  async function del(kind: string) {
    if (!confirm(`Delete kind "${kind}"?`)) return;
    onError("");
    setActionKind(kind);
    const res = await fetch(`/api/admin/kinds/${encodeURIComponent(kind)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to delete kind");
    }
    setActionKind(null);
    reload();
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {kinds.map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)" }}>
            <span className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>{kindLabel(k)}</span>
            {!inUse.has(k) && (
              <button
                onClick={() => del(k)}
                disabled={actionKind === k}
                style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", padding: "2px 6px", opacity: actionKind === k ? 0.5 : 1 }}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "end", maxWidth: "320px" }}>
        <div style={{ flex: 1 }}>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>New kind (snake_case)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="beach" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
        </div>
        <button onClick={add} disabled={addLoading} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: addLoading ? 0.6 : 1 }}>ADD</button>
      </div>
    </div>
  );
}

function LocationsSection({ locations, onError, reload }: { locations: LocationRow[]; onError: (e: string) => void; reload: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"province" | "city">("province");
  const [parentId, setParentId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const provinces = locations.filter((l) => l.type === "province");
  const nameById = new Map(locations.map((l) => [l.id, l.name]));

  async function add() {
    if (!name.trim()) return;
    if (type === "city" && !parentId) { onError("Select a parent province"); return; }
    setAddLoading(true);
    onError("");
    const res = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type, parent_id: type === "city" ? parentId : null }),
    });
    const json = await res.json();
    if (!res.ok) { onError(json.error ?? "Failed to add location"); setAddLoading(false); return; }
    setName(""); setParentId("");
    setAddLoading(false);
    reload();
  }

  async function rename(loc: LocationRow) {
    const next = prompt("New name:", loc.name);
    if (!next || !next.trim() || next.trim() === loc.name) return;
    onError("");
    setActionId(loc.id);
    const res = await fetch(`/api/admin/locations/${loc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next.trim() }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to rename");
    }
    setActionId(null);
    reload();
  }

  async function del(loc: LocationRow) {
    if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
    onError("");
    setActionId(loc.id);
    const res = await fetch(`/api/admin/locations/${loc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to delete");
    }
    setActionId(null);
    reload();
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px", alignItems: "end" }}>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jawa Barat" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as "province" | "city")} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
            <option value="province" style={{ background: "#111111" }}>Province</option>
            <option value="city" style={{ background: "#111111" }}>City</option>
          </select>
        </div>
        {type === "city" && (
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Parent province</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
              <option value="">— Select —</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id} style={{ background: "#111111" }}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={add} disabled={addLoading} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: addLoading ? 0.6 : 1 }}>ADD</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
            <tr>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Parent</TH>
              <TH>Slug</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} style={rowStyle}>
                <Cell>{l.name}</Cell>
                <Cell muted>{l.type}</Cell>
                <Cell muted>{l.parent_id ? nameById.get(l.parent_id) ?? "—" : "—"}</Cell>
                <Cell muted>{l.slug}</Cell>
                <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => rename(l)} disabled={actionId === l.id} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", opacity: actionId === l.id ? 0.5 : 1 }}>RENAME</button>
                    <button onClick={() => del(l)} disabled={actionId === l.id} style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.3)", opacity: actionId === l.id ? 0.5 : 1 }}>DELETE</button>
                  </div>
                </td>
              </tr>
            ))}
            {!locations.length && (
              <tr><td colSpan={5} className="font-body text-muted-ink" style={{ padding: "16px", fontSize: "0.82rem" }}>No locations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DestinationsSection({ destinations, locations, kinds, onError, reload }: { destinations: DestinationRow[]; locations: LocationRow[]; kinds: string[]; onError: (e: string) => void; reload: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState(kinds[0] ?? "mountain");
  const [parentId, setParentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [elevation, setElevation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", kind: "", parentId: "", locationId: "", elevation: "", description: "", imageUrl: "", slug: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const mountains = destinations.filter((d) => d.kind === "mountain");
  const nameById = new Map(destinations.map((d) => [d.id, d.name]));

  function startEdit(d: DestinationRow) {
    onError("");
    setEditingId(d.id);
    setEditForm({
      name: d.name,
      kind: d.kind,
      parentId: d.parent_id ?? "",
      locationId: d.location_id ?? "",
      elevation: d.elevation_m != null ? String(d.elevation_m) : "",
      description: d.description ?? "",
      imageUrl: d.image_url ?? "",
      slug: d.slug ?? "",
    });
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) { onError("Name is required"); return; }
    if (editForm.slug && slugify(editForm.slug) !== editForm.slug) { onError("Slug must be lowercase, alphanumeric, hyphen-separated"); return; }
    setEditSaving(true);
    onError("");
    const res = await fetch(`/api/admin/destinations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        kind: editForm.kind,
        parent_id: editForm.kind === "trail" ? (editForm.parentId || null) : null,
        location_id: editForm.locationId || null,
        elevation_m: editForm.elevation || null,
        description: editForm.description.trim() || null,
        image_url: editForm.imageUrl.trim() || null,
        slug: editForm.slug,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to save changes");
      setEditSaving(false);
      return;
    }
    setEditSaving(false);
    setEditingId(null);
    reload();
  }

  async function add() {
    if (!name.trim()) return;
    if (kind === "trail" && !parentId) { onError("Select a parent mountain"); return; }
    setAddLoading(true);
    onError("");
    const res = await fetch("/api/admin/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        kind,
        parent_id: kind === "trail" ? parentId : null,
        location_id: locationId || null,
        elevation_m: elevation || null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { onError(json.error ?? "Failed to add destination"); setAddLoading(false); return; }
    setName(""); setParentId(""); setLocationId(""); setElevation(""); setDescription(""); setImageUrl("");
    setAddLoading(false);
    reload();
  }

  async function del(d: DestinationRow) {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
    onError("");
    setActionId(d.id);
    const res = await fetch(`/api/admin/destinations/${d.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to delete");
    }
    setActionId(null);
    reload();
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mount Rinjani" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
            {kinds.map((k) => <option key={k} value={k} style={{ background: "#111111" }}>{kindLabel(k)}</option>)}
          </select>
        </div>
        {kind === "trail" && (
          <div>
            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Parent mountain</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
              <option value="">— Select —</option>
              {mountains.map((m) => <option key={m.id} value={m.id} style={{ background: "#111111" }}>{m.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Location</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
            <option value="">— None —</option>
            {locations.map((l) => <option key={l.id} value={l.id} style={{ background: "#111111" }}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Elevation (m)</label>
          <input type="number" value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="3726" className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Image URL</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="font-body text-off-white placeholder:text-muted-ink focus:outline-none" style={fieldStyle} />
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="font-body text-off-white placeholder:text-muted-ink focus:outline-none resize-none" style={{ ...fieldStyle, lineHeight: 1.6 }} />
      </div>
      <button onClick={add} disabled={addLoading} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: addLoading ? 0.6 : 1, marginBottom: "20px" }}>ADD DESTINATION</button>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
            <tr>
              <TH>Name</TH>
              <TH>Kind</TH>
              <TH>Slug</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => (
              <Fragment key={d.id}>
                <tr style={rowStyle}>
                  <Cell>{d.name}{d.parent_id ? <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}> ({nameById.get(d.parent_id) ?? "—"})</span> : null}</Cell>
                  <Cell muted>{kindLabel(d.kind)}</Cell>
                  <Cell muted>{d.slug}</Cell>
                  <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => (editingId === d.id ? setEditingId(null) : startEdit(d))} disabled={actionId === d.id} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", opacity: actionId === d.id ? 0.5 : 1 }}>{editingId === d.id ? "CLOSE" : "EDIT"}</button>
                      <button onClick={() => del(d)} disabled={actionId === d.id} style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.3)", opacity: actionId === d.id ? 0.5 : 1 }}>DELETE</button>
                    </div>
                  </td>
                </tr>
                {editingId === d.id && (
                  <tr style={rowStyle}>
                    <td colSpan={4} style={{ padding: "16px", background: "#141414" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Name</label>
                          <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                        </div>
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Kind</label>
                          <select value={editForm.kind} onChange={(e) => setEditForm((f) => ({ ...f, kind: e.target.value }))} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                            {kinds.map((k) => <option key={k} value={k} style={{ background: "#111111" }}>{kindLabel(k)}</option>)}
                          </select>
                        </div>
                        {editForm.kind === "trail" && (
                          <div>
                            <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Parent mountain</label>
                            <select value={editForm.parentId} onChange={(e) => setEditForm((f) => ({ ...f, parentId: e.target.value }))} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                              <option value="">— Select —</option>
                              {mountains.filter((m) => m.id !== d.id).map((m) => <option key={m.id} value={m.id} style={{ background: "#111111" }}>{m.name}</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Location</label>
                          <select value={editForm.locationId} onChange={(e) => setEditForm((f) => ({ ...f, locationId: e.target.value }))} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
                            <option value="">— None —</option>
                            {locations.map((l) => <option key={l.id} value={l.id} style={{ background: "#111111" }}>{l.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Elevation (m)</label>
                          <input type="number" value={editForm.elevation} onChange={(e) => setEditForm((f) => ({ ...f, elevation: e.target.value }))} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                        </div>
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Image URL</label>
                          <input value={editForm.imageUrl} onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                        </div>
                        <div>
                          <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Slug</label>
                          <input value={editForm.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} className="font-body text-off-white focus:outline-none" style={fieldStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <label className="font-body font-semibold text-muted-ink uppercase block" style={{ fontSize: "0.55rem", letterSpacing: "0.12em", marginBottom: "4px" }}>Description</label>
                        <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="font-body text-off-white focus:outline-none resize-none" style={{ ...fieldStyle, lineHeight: 1.6 }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => saveEdit(d.id)} disabled={editSaving} style={{ ...BTN.base, background: "#9BFF3C", color: "#111111", padding: "8px 16px", opacity: editSaving ? 0.6 : 1 }}>{editSaving ? "SAVING..." : "SAVE"}</button>
                        <button onClick={() => setEditingId(null)} disabled={editSaving} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)" }}>CANCEL</button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!destinations.length && (
              <tr><td colSpan={4} className="font-body text-muted-ink" style={{ padding: "16px", fontSize: "0.82rem" }}>No destinations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
