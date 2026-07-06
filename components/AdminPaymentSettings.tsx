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

const BTN = {
  base: {
    fontFamily: "inherit" as const,
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    padding: "5px 12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700 as const,
  },
  primary: {
    background: "#9BFF3C",
    color: "#111111",
    border: "none",
  },
  danger: {
    background: "rgba(255,107,26,0.15)",
    color: "#FF6B1A",
    border: "1px solid rgba(255,107,26,0.4)",
  },
  ghost: {
    background: "transparent",
    color: "#8B7355",
    border: "1px solid rgba(74,59,42,0.4)",
  },
  edit: {
    background: "transparent",
    color: "#F0EDEA",
    border: "1px solid rgba(74,59,42,0.4)",
  },
} as const;

const fieldStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  borderBottom: "2px solid #4A3B2A",
  padding: "8px 0",
  fontSize: "0.88rem",
  color: "#F0EDEA",
  width: "100%",
  fontFamily: "inherit",
  outline: "none",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "56px",
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid rgba(74,59,42,0.35)",
  padding: "24px",
};

export default function AdminPaymentSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"banks" | "qris" | "settings">("banks");
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [qrisAccounts, setQrisAccounts] = useState<QrisAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [bankForm, setBankForm] = useState({ bank_name: "", account_name: "", account_number: "", branch: "" });
  const [editingBank, setEditingBank] = useState<string | null>(null);

  const [qrisForm, setQrisForm] = useState({ name: "", image_url: "" });
  const [editingQris, setEditingQris] = useState<string | null>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [businessHours, setBusinessHours] = useState({
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    start: "09:00",
    end: "17:00",
    timezone: "Asia/Jakarta",
  });

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
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bankForm),
    });
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
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qrisForm),
    });
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem" }}>Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.3)", padding: "12px 16px", marginBottom: "24px" }}>
          <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem" }}>{error}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "32px", borderBottom: "1px solid rgba(74,59,42,0.3)", paddingBottom: "12px" }}>
        {(["banks", "qris", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-body font-semibold transition-colors duration-150 ${activeTab === tab ? "text-neon-green" : "text-muted-ink hover:text-neon-green"}`}
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              padding: "6px 20px",
              background: "transparent",
              border: activeTab === tab ? "1px solid rgba(155,255,60,0.3)" : "1px solid rgba(74,59,42,0.4)",
              cursor: "pointer",
            }}
          >
            {tab === "banks" ? "BANK ACCOUNTS" : tab === "qris" ? "QRIS" : "SETTINGS"}
          </button>
        ))}
      </div>

      {activeTab === "banks" && (
        <section style={sectionStyle}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            BANK ACCOUNTS
          </h2>

          {banks.length === 0 ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem", marginBottom: "24px" }}>
              No bank accounts yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Bank</th>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Account</th>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Branch</th>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank.id} style={{ borderBottom: "1px solid rgba(74,59,42,0.2)" }}>
                      <td className="font-body text-off-white" style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}>{bank.bank_name}</td>
                      <td className="font-body text-off-white" style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}>
                        {bank.account_number}<br />
                        <span className="text-muted-ink" style={{ fontSize: "0.72rem" }}>a.n. {bank.account_name}</span>
                      </td>
                      <td className="font-body text-muted-ink" style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}>{bank.branch ?? "—"}</td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setEditingBank(bank.id);
                              setBankForm({
                                bank_name: bank.bank_name,
                                account_name: bank.account_name,
                                account_number: bank.account_number,
                                branch: bank.branch ?? "",
                              });
                            }}
                            style={{ ...BTN.base, ...BTN.edit }}
                          >
                            EDIT
                          </button>
                          <button onClick={() => deleteBank(bank.id)} style={{ ...BTN.base, ...BTN.danger }}>
                            HAPUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={cardStyle}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "20px" }}>
              {editingBank ? "EDIT BANK" : "TAMBAH BANK"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>Nama Bank</label>
                <input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="BCA, Mandiri, etc" style={fieldStyle} />
              </div>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>No. Rekening</label>
                <input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} placeholder="1234567890" style={fieldStyle} />
              </div>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>Atas Nama</label>
                <input value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} placeholder="PT VAKANSISME" style={fieldStyle} />
              </div>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>Cabang (opsional)</label>
                <input value={bankForm.branch} onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })} placeholder="Jakarta" style={fieldStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={saveBank}
                disabled={saving || !bankForm.bank_name || !bankForm.account_name || !bankForm.account_number}
                style={{ ...BTN.base, ...BTN.primary, opacity: saving || !bankForm.bank_name || !bankForm.account_name || !bankForm.account_number ? 0.5 : 1 }}
              >
                {saving ? "..." : editingBank ? "UPDATE" : "SIMPAN"}
              </button>
              {editingBank && (
                <button
                  onClick={() => { setEditingBank(null); setBankForm({ bank_name: "", account_name: "", account_number: "", branch: "" }); }}
                  style={{ ...BTN.base, ...BTN.ghost }}
                >
                  BATAL
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "qris" && (
        <section style={sectionStyle}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            QRIS
          </h2>

          {qrisAccounts.length === 0 ? (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.88rem", marginBottom: "24px" }}>
              No QRIS accounts yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(74,59,42,0.4)" }}>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Name</th>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Status</th>
                    <th className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qrisAccounts.map((qris) => (
                    <tr key={qris.id} style={{ borderBottom: "1px solid rgba(74,59,42,0.2)" }}>
                      <td className="font-body text-off-white" style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}>{qris.name}</td>
                      <td className="font-body" style={{ fontSize: "0.72rem", padding: "12px 16px", verticalAlign: "middle", color: qris.is_active ? "#9BFF3C" : "#8B7355" }}>
                        {qris.is_active ? "ACTIVE" : "INACTIVE"}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setEditingQris(qris.id);
                              setQrisForm({ name: qris.name, image_url: qris.image_url });
                            }}
                            style={{ ...BTN.base, ...BTN.edit }}
                          >
                            EDIT
                          </button>
                          <button onClick={() => deleteQris(qris.id)} style={{ ...BTN.base, ...BTN.danger }}>
                            HAPUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={cardStyle}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "20px" }}>
              {editingQris ? "EDIT QRIS" : "TAMBAH QRIS"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>Nama QRIS</label>
                <input value={qrisForm.name} onChange={(e) => setQrisForm({ ...qrisForm, name: e.target.value })} placeholder="QRIS VAKANSISME" style={fieldStyle} />
              </div>
              <div>
                <label className="font-body text-muted-ink" style={{ fontSize: "0.68rem", display: "block", marginBottom: "4px" }}>URL Gambar</label>
                <input value={qrisForm.image_url} onChange={(e) => setQrisForm({ ...qrisForm, image_url: e.target.value })} placeholder="https://..." style={fieldStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={saveQris}
                disabled={saving || !qrisForm.name || !qrisForm.image_url}
                style={{ ...BTN.base, ...BTN.primary, opacity: saving || !qrisForm.name || !qrisForm.image_url ? 0.5 : 1 }}
              >
                {saving ? "..." : editingQris ? "UPDATE" : "SIMPAN"}
              </button>
              {editingQris && (
                <button
                  onClick={() => { setEditingQris(null); setQrisForm({ name: "", image_url: "" }); }}
                  style={{ ...BTN.base, ...BTN.ghost }}
                >
                  BATAL
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <section style={sectionStyle}>
          <h2
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}
          >
            GENERAL SETTINGS
          </h2>

          <div style={cardStyle}>
            <div style={{ marginBottom: "24px" }}>
              <label className="font-body text-muted-ink" style={{ fontSize: "0.72rem", display: "block", marginBottom: "6px" }}>WhatsApp Number</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="62812xxxx"
                style={fieldStyle}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label className="font-body text-muted-ink" style={{ fontSize: "0.72rem", display: "block", marginBottom: "6px" }}>Business Hours</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="font-body text-muted-ink" style={{ fontSize: "0.62rem", display: "block", marginBottom: "4px" }}>Start</label>
                  <input value={businessHours.start} onChange={(e) => setBusinessHours({ ...businessHours, start: e.target.value })} placeholder="09:00" style={fieldStyle} />
                </div>
                <div>
                  <label className="font-body text-muted-ink" style={{ fontSize: "0.62rem", display: "block", marginBottom: "4px" }}>End</label>
                  <input value={businessHours.end} onChange={(e) => setBusinessHours({ ...businessHours, end: e.target.value })} placeholder="17:00" style={fieldStyle} />
                </div>
                <div>
                  <label className="font-body text-muted-ink" style={{ fontSize: "0.62rem", display: "block", marginBottom: "4px" }}>Timezone</label>
                  <input value={businessHours.timezone} onChange={(e) => setBusinessHours({ ...businessHours, timezone: e.target.value })} placeholder="Asia/Jakarta" style={fieldStyle} />
                </div>
              </div>
            </div>

            <button onClick={saveSettings} disabled={saving} style={{ ...BTN.base, ...BTN.primary, opacity: saving ? 0.5 : 1 }}>
              {saving ? "..." : "SIMPAN SETTINGS"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
