"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/seo";

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
  kind: "mountain" | "trail" | "national_park";
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

export default function AdminDestinations() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    Promise.all([
      fetch("/api/admin/locations").then((r) => r.json()),
      fetch("/api/admin/destinations").then((r) => r.json()),
    ])
      .then(([locJson, destJson]) => {
        setLocations(locJson.locations ?? []);
        setDestinations(destJson.destinations ?? []);
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
      <Section title="DESTINATIONS">
        <DestinationsSection destinations={destinations} locations={locations} onError={setError} reload={load} />
      </Section>
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

const KINDS = ["mountain", "trail", "national_park"] as const;

function DestinationsSection({ destinations, locations, onError, reload }: { destinations: DestinationRow[]; locations: LocationRow[]; onError: (e: string) => void; reload: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<typeof KINDS[number]>("mountain");
  const [parentId, setParentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [elevation, setElevation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const mountains = destinations.filter((d) => d.kind === "mountain");
  const nameById = new Map(destinations.map((d) => [d.id, d.name]));

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

  async function rename(d: DestinationRow) {
    const next = prompt("New name:", d.name);
    if (!next || !next.trim() || next.trim() === d.name) return;
    setActionId(d.id);
    const res = await fetch(`/api/admin/destinations/${d.id}`, {
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

  async function editSlug(d: DestinationRow) {
    const next = prompt("New slug:", d.slug ?? "");
    if (next === null || !next.trim() || next.trim() === d.slug) return;
    const slug = next.trim();
    if (slugify(slug) !== slug) { onError("Slug must be lowercase, alphanumeric, hyphen-separated"); return; }
    setActionId(d.id);
    const res = await fetch(`/api/admin/destinations/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      onError(json.error ?? "Failed to update slug");
    }
    setActionId(null);
    reload();
  }

  async function del(d: DestinationRow) {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
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
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof KINDS[number])} className="font-body text-off-white focus:outline-none" style={{ ...fieldStyle, cursor: "pointer" }}>
            {KINDS.map((k) => <option key={k} value={k} style={{ background: "#111111" }}>{k}</option>)}
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
              <tr key={d.id} style={rowStyle}>
                <Cell>{d.name}{d.parent_id ? <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}> ({nameById.get(d.parent_id) ?? "—"})</span> : null}</Cell>
                <Cell muted>{d.kind}</Cell>
                <Cell muted>{d.slug}</Cell>
                <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => rename(d)} disabled={actionId === d.id} style={{ ...BTN.base, background: "transparent", color: "#8B7355", border: "1px solid rgba(74,59,42,0.4)", opacity: actionId === d.id ? 0.5 : 1 }}>RENAME</button>
                    <button onClick={() => editSlug(d)} disabled={actionId === d.id} style={{ ...BTN.base, background: "transparent", color: "#9BFF3C", border: "1px solid rgba(155,255,60,0.3)", opacity: actionId === d.id ? 0.5 : 1 }}>SLUG</button>
                    <button onClick={() => del(d)} disabled={actionId === d.id} style={{ ...BTN.base, background: "transparent", color: "#FF6B1A", border: "1px solid rgba(255,107,26,0.3)", opacity: actionId === d.id ? 0.5 : 1 }}>DELETE</button>
                  </div>
                </td>
              </tr>
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
