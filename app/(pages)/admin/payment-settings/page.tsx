"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string | null;
  is_active: boolean;
  display_order: number;
};

type QrisAccount = {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
};

export default function AdminPaymentSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"banks" | "qris" | "settings">("banks");
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [qrisAccounts, setQrisAccounts] = useState<QrisAccount[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Bank form
  const [bankForm, setBankForm] = useState({ bank_name: "", account_name: "", account_number: "", branch: "" });
  const [editingBank, setEditingBank] = useState<string | null>(null);

  // QRIS form
  const [qrisForm, setQrisForm] = useState({ name: "", image_url: "" });
  const [editingQris, setEditingQris] = useState<string | null>(null);

  // Settings form
  const [whatsapp, setWhatsapp] = useState("");
  const [businessHours, setBusinessHours] = useState({ days: ["monday","tuesday","wednesday","thursday","friday"], start: "09:00", end: "17:00", timezone: "Asia/Jakarta" });

  useEffect(() => {
    async function load() {
      try {
        const [banksRes, qrisRes, settingsRes] = await Promise.all([
          fetch("/api/admin/bank-accounts"),
          fetch("/api/admin/qris-accounts"),
          fetch("/api/admin/payment-settings"),
        ]);

        if (banksRes.ok) setBanks(await banksRes.json());
        if (qrisRes.ok) setQrisAccounts(await qrisRes.json());
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setSettings(s);
          setWhatsapp(s.whatsapp_number?.number ?? "");
          if (s.business_hours) setBusinessHours(s.business_hours as typeof businessHours);
        }
      } catch {
        setError("Gagal memuat data");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveBank() {
    setSaving(true);
    const url = editingBank ? `/api/admin/bank-accounts/${editingBank}` : "/api/admin/bank-accounts";
    const method = editingBank ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(bankForm) });
    if (res.ok) {
      setBankForm({ bank_name: "", account_name: "", account_number: "", branch: "" });
      setEditingBank(null);
      const data = await fetch("/api/admin/bank-accounts");
      if (data.ok) setBanks(await data.json());
    } else {
      const err = await res.json();
      setError(err.error ?? "Gagal simpan bank");
    }
    setSaving(false);
  }

  async function deleteBank(id: string) {
    if (!confirm("Hapus rekening bank ini?")) return;
    const res = await fetch(`/api/admin/bank-accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBanks((prev) => prev.filter((b) => b.id !== id));
    }
  }

  async function saveQris() {
    setSaving(true);
    const url = editingQris ? `/api/admin/qris-accounts/${editingQris}` : "/api/admin/qris-accounts";
    const method = editingQris ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(qrisForm) });
    if (res.ok) {
      setQrisForm({ name: "", image_url: "" });
      setEditingQris(null);
      const data = await fetch("/api/admin/qris-accounts");
      if (data.ok) setQrisAccounts(await data.json());
    } else {
      const err = await res.json();
      setError(err.error ?? "Gagal simpan QRIS");
    }
    setSaving(false);
  }

  async function deleteQris(id: string) {
    if (!confirm("Hapus QRIS ini?")) return;
    const res = await fetch(`/api/admin/qris-accounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQrisAccounts((prev) => prev.filter((q) => q.id !== id));
    }
  }

  async function saveSettings() {
    setSaving(true);
    const res = await fetch("/api/admin/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp_number: { number: whatsapp, label: "Admin" },
        business_hours: businessHours,
      }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Gagal simpan settings");
    }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen bg-charcoal flex items-center justify-center"><p className="font-body text-muted-ink">Memuat...</p></div>;

  const tabStyle = (tab: string) => ({
    fontSize: "0.68rem",
    letterSpacing: "0.12em",
    padding: "8px 20px",
    background: activeTab === tab ? "#9BFF3C" : "transparent",
    color: activeTab === tab ? "#111" : "#8B7355",
    border: activeTab === tab ? "none" : "1px solid rgba(74,59,42,0.4)",
    cursor: "pointer",
  });

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-5xl mx-auto px-6" style={{ paddingTop: "32px", paddingBottom: "80px" }}>
        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "24px" }}>
          PAYMENT SETTINGS
        </h1>

        {error && (
          <div style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.3)", padding: "12px 16px", marginBottom: "16px" }}>
            <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem" }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button onClick={() => setActiveTab("banks")} style={tabStyle("banks")}>BANK ACCOUNTS</button>
          <button onClick={() => setActiveTab("qris")} style={tabStyle("qris")}>QRIS</button>
          <button onClick={() => setActiveTab("settings")} style={tabStyle("settings")}>SETTINGS</button>
        </div>

        {/* Banks Tab */}
        {activeTab === "banks" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {banks.map((bank) => (
                <div key={bank.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }}>
                  <div>
                    <p className="font-body font-bold text-off-white" style={{ fontSize: "0.85rem" }}>{bank.bank_name}</p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>{bank.account_number} · a.n. {bank.account_name}</p>
                    {bank.branch && <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem" }}>{bank.branch}</p>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setEditingBank(bank.id); setBankForm({ bank_name: bank.bank_name, account_name: bank.account_name, account_number: bank.account_number, branch: bank.branch ?? "" }); }}
                      className="font-body text-muted-ink hover:text-off-white"
                      style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteBank(bank.id)} className="font-body text-chaos-orange" style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px" }}>
              <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>
                {editingBank ? "EDIT BANK" : "TAMBAH BANK"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="Nama Bank" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
                <input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} placeholder="No. Rekening" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
                <input value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} placeholder="Atas Nama" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
                <input value={bankForm.branch} onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })} placeholder="Cabang (opsional)" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={saveBank} disabled={saving || !bankForm.bank_name || !bankForm.account_name || !bankForm.account_number} className="font-body font-semibold text-charcoal bg-neon-green" style={{ fontSize: "0.68rem", padding: "10px 24px", border: "none", cursor: "pointer" }}>
                  {saving ? "..." : editingBank ? "UPDATE" : "SIMPAN"}
                </button>
                {editingBank && <button onClick={() => { setEditingBank(null); setBankForm({ bank_name: "", account_name: "", account_number: "", branch: "" }); }} className="font-body text-muted-ink" style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}>Batal</button>}
              </div>
            </div>
          </div>
        )}

        {/* QRIS Tab */}
        {activeTab === "qris" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
              {qrisAccounts.map((qris) => (
                <div key={qris.id} style={{ width: "180px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", padding: "16px", textAlign: "center" }}>
                  <p className="font-body font-bold text-off-white" style={{ fontSize: "0.78rem", marginBottom: "8px" }}>{qris.name}</p>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button onClick={() => { setEditingQris(qris.id); setQrisForm({ name: qris.name, image_url: qris.image_url }); }} className="font-body text-muted-ink" style={{ fontSize: "0.65rem", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteQris(qris.id)} className="font-body text-chaos-orange" style={{ fontSize: "0.65rem", background: "none", border: "none", cursor: "pointer" }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px" }}>
              <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>
                {editingQris ? "EDIT QRIS" : "TAMBAH QRIS"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input value={qrisForm.name} onChange={(e) => setQrisForm({ ...qrisForm, name: e.target.value })} placeholder="Nama (misal: QRIS VAKANSISME)" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
                <input value={qrisForm.image_url} onChange={(e) => setQrisForm({ ...qrisForm, image_url: e.target.value })} placeholder="URL Gambar QRIS" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={saveQris} disabled={saving || !qrisForm.name || !qrisForm.image_url} className="font-body font-semibold text-charcoal bg-neon-green" style={{ fontSize: "0.68rem", padding: "10px 24px", border: "none", cursor: "pointer" }}>
                  {saving ? "..." : editingQris ? "UPDATE" : "SIMPAN"}
                </button>
                {editingQris && <button onClick={() => { setEditingQris(null); setQrisForm({ name: "", image_url: "" }); }} className="font-body text-muted-ink" style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}>Batal</button>}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "20px" }}>GENERAL SETTINGS</p>

            <div style={{ marginBottom: "20px" }}>
              <label className="font-body text-muted-ink" style={{ fontSize: "0.72rem", display: "block", marginBottom: "6px" }}>WhatsApp Number</label>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="62812xxxx" className="font-body" style={{ width: "100%", padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="font-body text-muted-ink" style={{ fontSize: "0.72rem", display: "block", marginBottom: "6px" }}>Business Hours</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input value={businessHours.start} onChange={(e) => setBusinessHours({ ...businessHours, start: e.target.value })} placeholder="Start (HH:MM)" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem", width: "120px" }} />
                <input value={businessHours.end} onChange={(e) => setBusinessHours({ ...businessHours, end: e.target.value })} placeholder="End (HH:MM)" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem", width: "120px" }} />
                <input value={businessHours.timezone} onChange={(e) => setBusinessHours({ ...businessHours, timezone: e.target.value })} placeholder="Timezone" className="font-body" style={{ padding: "10px", background: "#111", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", fontSize: "0.78rem", width: "160px" }} />
              </div>
            </div>

            <button onClick={saveSettings} disabled={saving} className="font-body font-semibold text-charcoal bg-neon-green" style={{ fontSize: "0.68rem", padding: "10px 24px", border: "none", cursor: "pointer" }}>
              {saving ? "..." : "SIMPAN SETTINGS"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
