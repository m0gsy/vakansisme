"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

type Item = { id: string; label: string };

const TEMPLATES: Record<string, string[]> = {
  "Beach Trip": ["Sunscreen", "Sandals", "Towel", "Swimsuit", "Hat", "Sunglasses", "Water bottle", "Snorkel set", "Camera", "First aid kit"],
  "Mountain Hike": ["Hiking boots", "Trekking poles", "Rain jacket", "Headlamp + batteries", "Water filter", "Emergency blanket", "High-calorie snacks", "Warm layers", "First aid kit", "Map or GPS"],
  "Backpacking": ["Tent", "Sleeping bag", "Cooking stove + fuel", "Water purifier", "Multi-tool", "Rope / paracord", "Food for days", "Rain cover for bag", "Headlamp", "Power bank"],
};

export default function PackingList({
  expeditionId,
  initialItems,
  isLeader,
}: {
  expeditionId: string;
  initialItems: Item[];
  isLeader: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  async function add(label?: string) {
    const text = (label ?? input).trim();
    if (!text) return;
    setAdding(true);
    const res = await fetch(`/api/expeditions/${expeditionId}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: text }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      if (!label) setInput("");
      toast("Item added.", "success");
    }
    setAdding(false);
  }

  async function applyTemplate(templateItems: string[]) {
    setShowTemplates(false);
    const existing = new Set(items.map((i) => i.label.toLowerCase()));
    const toAdd = templateItems.filter((t) => !existing.has(t.toLowerCase()));
    for (const label of toAdd) {
      await add(label);
    }
  }

  async function remove(itemId: string) {
    await fetch(`/api/expeditions/${expeditionId}/packing`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (!items.length && !isLeader) return null;

  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em" }}>
          PACKING LIST
        </h2>
        {isLeader && (
          <button
            onClick={() => setShowTemplates((s) => !s)}
            className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em", background: "transparent", border: "1px solid rgba(74,59,42,0.4)", padding: "5px 12px", cursor: "pointer" }}
          >
            {showTemplates ? "CLOSE" : "TEMPLATES"}
          </button>
        )}
      </div>

      {/* Template selector */}
      {showTemplates && isLeader && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)" }}>
          <p className="font-body font-semibold text-muted-ink uppercase mb-3" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
            SELECT TEMPLATE
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(TEMPLATES).map(([name, templateItems]) => (
              <button
                key={name}
                onClick={() => applyTemplate(templateItems)}
                disabled={adding}
                className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150 disabled:opacity-50"
                style={{ background: "transparent", border: "1px solid rgba(74,59,42,0.4)", padding: "7px 14px", fontSize: "0.68rem", letterSpacing: "0.06em", cursor: adding ? "not-allowed" : "pointer" }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!items.length && (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "16px" }}>No items yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: isLeader ? "16px" : 0 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
            <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>☐</span>
            <span className="font-body text-off-white" style={{ fontSize: "0.88rem", flex: 1 }}>{item.label}</span>
            {isLeader && (
              <button onClick={() => remove(item.id)} className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", padding: "2px 6px" }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {isLeader && (
        <div style={{ display: "flex", gap: "8px" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add item..."
            className="font-body text-off-white bg-transparent"
            style={{ flex: 1, border: "1px solid rgba(74,59,42,0.4)", padding: "10px 14px", fontSize: "0.82rem", outline: "none" }}
          />
          <button onClick={() => add()} disabled={adding || !input.trim()}
            className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
            style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 18px", cursor: adding ? "not-allowed" : "pointer", border: "none" }}>
            ADD
          </button>
        </div>
      )}
    </section>
  );
}
