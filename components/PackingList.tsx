"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

type Item = { id: string; label: string; category: string; quantity: number; checked: boolean };

const CATEGORIES = ["general", "clothing", "food", "gear", "safety"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  general: "Umum",
  clothing: "Pakaian",
  food: "Makanan & Air",
  gear: "Peralatan",
  safety: "Keselamatan",
};

const TEMPLATES: Record<string, Array<{ label: string; category: Category; quantity: number }>> = {
  "Beach Trip": [
    { label: "Sunscreen", category: "safety", quantity: 1 },
    { label: "Sandals", category: "clothing", quantity: 1 },
    { label: "Towel", category: "general", quantity: 1 },
    { label: "Swimsuit", category: "clothing", quantity: 2 },
    { label: "Hat", category: "clothing", quantity: 1 },
    { label: "Sunglasses", category: "clothing", quantity: 1 },
    { label: "Water bottle", category: "food", quantity: 1 },
    { label: "Snorkel set", category: "gear", quantity: 1 },
    { label: "First aid kit", category: "safety", quantity: 1 },
  ],
  "Mountain Hike": [
    { label: "Hiking boots", category: "clothing", quantity: 1 },
    { label: "Trekking poles", category: "gear", quantity: 2 },
    { label: "Rain jacket", category: "clothing", quantity: 1 },
    { label: "Headlamp + batteries", category: "gear", quantity: 1 },
    { label: "Water filter", category: "gear", quantity: 1 },
    { label: "Emergency blanket", category: "safety", quantity: 1 },
    { label: "High-calorie snacks", category: "food", quantity: 3 },
    { label: "Warm layers", category: "clothing", quantity: 2 },
    { label: "First aid kit", category: "safety", quantity: 1 },
    { label: "Map or GPS", category: "gear", quantity: 1 },
  ],
  "Backpacking": [
    { label: "Tent", category: "gear", quantity: 1 },
    { label: "Sleeping bag", category: "gear", quantity: 1 },
    { label: "Cooking stove + fuel", category: "gear", quantity: 1 },
    { label: "Water purifier", category: "gear", quantity: 1 },
    { label: "Multi-tool", category: "gear", quantity: 1 },
    { label: "Rope / paracord", category: "gear", quantity: 1 },
    { label: "Food for days", category: "food", quantity: 3 },
    { label: "Rain cover for bag", category: "gear", quantity: 1 },
    { label: "Headlamp", category: "gear", quantity: 1 },
    { label: "Power bank", category: "general", quantity: 1 },
  ],
};

function groupByCategory(items: Item[]): Map<Category, Item[]> {
  const map = new Map<Category, Item[]>();
  for (const item of items) {
    const cat = (CATEGORIES.includes(item.category as Category) ? item.category : "general") as Category;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return map;
}

export default function PackingList({
  expeditionId,
  initialItems,
  isLeader,
  isMember = false,
}: {
  expeditionId: string;
  initialItems: Item[];
  isLeader: boolean;
  isMember?: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  async function add(item?: { label: string; category: Category; quantity: number }) {
    const label = (item?.label ?? input).trim();
    if (!label) return;
    const cat = item?.category ?? category;
    const qty = item?.quantity ?? quantity;
    setAdding(true);
    const res = await fetch(`/api/expeditions/${expeditionId}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, category: cat, quantity: qty }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      if (!item) { setInput(""); setQuantity(1); }
      toast("Item ditambahkan.", "success");
    }
    setAdding(false);
  }

  async function remove(itemId: string) {
    await fetch(`/api/expeditions/${expeditionId}/packing`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function toggleCheck(itemId: string, checked: boolean) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, checked } : i));
    await fetch(`/api/expeditions/${expeditionId}/packing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, checked }),
    });
  }

  async function applyTemplate(templateItems: typeof TEMPLATES[string]) {
    setShowTemplates(false);
    const existing = new Set(items.map((i) => i.label.toLowerCase()));
    const toAdd = templateItems.filter((t) => !existing.has(t.label.toLowerCase()));
    for (const item of toAdd) {
      await add(item);
    }
  }

  if (!items.length && !isLeader) return null;

  const grouped = groupByCategory(items);
  const canCheck = isMember || isLeader;

  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", letterSpacing: "-0.02em" }}>
          DAFTAR PERLENGKAPAN
        </h2>
        {isLeader && (
          <button
            onClick={() => setShowTemplates((s) => !s)}
            className="font-body font-semibold text-muted-ink hover:text-neon-green transition-colors duration-150"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em", background: "transparent", border: "1px solid rgba(74,59,42,0.4)", padding: "5px 12px", cursor: "pointer" }}
          >
            {showTemplates ? "TUTUP" : "TEMPLATE"}
          </button>
        )}
      </div>

      {/* Template selector */}
      {showTemplates && isLeader && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)" }}>
          <p className="font-body font-semibold text-muted-ink uppercase mb-3" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
            PILIH TEMPLATE
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
        <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "16px" }}>Belum ada item.</p>
      )}

      {/* Grouped items */}
      {Array.from(grouped.entries()).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: "20px" }}>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.58rem", letterSpacing: "0.14em", marginBottom: "6px" }}>
            {CATEGORY_LABELS[cat]}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {catItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 16px",
                  background: item.checked ? "rgba(155,255,60,0.06)" : "#1a1a1a",
                  border: `1px solid ${item.checked ? "rgba(155,255,60,0.2)" : "rgba(74,59,42,0.3)"}`,
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {canCheck ? (
                  <button
                    onClick={() => toggleCheck(item.id, !item.checked)}
                    className="transition-colors duration-150"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.85rem", color: item.checked ? "#9BFF3C" : "#4A3B2A", flexShrink: 0 }}
                    aria-label={item.checked ? "Uncheck" : "Check"}
                  >
                    {item.checked ? "✓" : "☐"}
                  </button>
                ) : (
                  <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem", flexShrink: 0 }}>☐</span>
                )}
                <span
                  className="font-body text-off-white"
                  style={{ fontSize: "0.88rem", flex: 1, textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "#4A3B2A" : "#F0EDEA", transition: "color 0.15s" }}
                >
                  {item.label}
                </span>
                {item.quantity > 1 && (
                  <span className="font-body text-muted-ink" style={{ fontSize: "0.68rem", letterSpacing: "0.04em", flexShrink: 0 }}>
                    ×{item.quantity}
                  </span>
                )}
                {isLeader && (
                  <button
                    onClick={() => remove(item.id)}
                    className="font-body text-muted-ink hover:text-chaos-orange transition-colors duration-150"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", padding: "2px 6px", flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add form — leader only */}
      {isLeader && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nama item..."
              className="font-body text-off-white bg-transparent"
              style={{ flex: "2 1 160px", border: "1px solid rgba(74,59,42,0.4)", padding: "10px 14px", fontSize: "0.82rem", outline: "none" }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="font-body text-muted-ink bg-charcoal"
              style={{ flex: "1 1 120px", border: "1px solid rgba(74,59,42,0.4)", padding: "10px 10px", fontSize: "0.75rem", outline: "none", cursor: "pointer" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-body text-off-white bg-transparent"
              style={{ width: "64px", border: "1px solid rgba(74,59,42,0.4)", padding: "10px 10px", fontSize: "0.82rem", outline: "none", textAlign: "center" }}
              title="Jumlah"
            />
            <button
              onClick={() => add()}
              disabled={adding || !input.trim()}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
              style={{ fontSize: "0.65rem", letterSpacing: "0.12em", padding: "10px 18px", cursor: adding ? "not-allowed" : "pointer", border: "none", whiteSpace: "nowrap" }}
            >
              TAMBAH
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
