"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type PaymentRow = {
  id: string;
  payment_order_id: string;
  amount_idr: number;
  payment_status: string;
  payment_method: string | null;
  proof_image_url: string | null;
  proof_uploaded_at: string | null;
  created_at: string;
  user_id: string;
  expedition_id: string;
  profile?: { username: string };
  expedition?: { name: string; slug: string };
};

type PageData = {
  payments: PaymentRow[];
  total: number;
  page: number;
  totalPages: number;
};

const statusColors: Record<string, string> = {
  pending: "#4A3B2A",
  waiting_verification: "#FF6B1A",
  paid: "#9BFF3C",
  rejected: "#7A2E12",
  expired: "#7A2E12",
  refunded: "#7A2E12",
  cancelled: "#4A3B2A",
};

function formatted(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function AdminPaymentsTable() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState("");
  const [processing, setProcessing] = useState(false);

  async function fetchData() {
    setData(null);
    setError("");
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", page.toString());
    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load payment data");
    }
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", page.toString());
    fetch(`/api/admin/payments?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => { if (!cancelled) { setData(json); setError(""); } })
      .catch(() => { if (!cancelled) setError("Failed to load payment data"); });
    return () => { cancelled = true; };
  }, [statusFilter, search, page]);

  async function handleAction(paymentId: string, action: string, extra?: Record<string, unknown>) {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payment_ids: [paymentId], ...extra }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionTarget(null);
        setRejectReason("");
        fetchData();
        router.refresh();
      } else {
        setError(json.error ?? "Action failed");
      }
    } catch {
      setError("Failed to process");
    }
    setProcessing(false);
  }

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          payment_ids: Array.from(selectedIds),
          reason: bulkAction === "reject" ? "Invalid proof" : undefined,
        }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        setBulkAction("");
        fetchData();
        router.refresh();
      }
    } catch {
      setError("Bulk action failed");
    }
    setProcessing(false);
  }

  const loading = data === null && !error;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "24px" }}>Manage participant payments</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setData(null); setError(""); }}
          className="font-body"
          style={{ fontSize: "0.72rem", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA" }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="waiting_verification">Waiting Verification</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setData(null); setError(""); }}
          placeholder="Search order ID or username..."
          className="font-body"
          style={{ fontSize: "0.72rem", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", flex: 1, minWidth: "200px" }}
        />

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{selectedIds.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="font-body"
              style={{ fontSize: "0.72rem", padding: "8px 12px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA" }}
            >
              <option value="">Bulk Action</option>
              <option value="verify">Approve All</option>
              <option value="reject">Reject All</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || processing}
              className="font-body font-semibold"
              style={{ fontSize: "0.68rem", padding: "8px 16px", background: "#FF6B1A", color: "#111", border: "none", cursor: "pointer", opacity: processing ? 0.5 : 1 }}
            >
              {processing ? "..." : "PROCESS"}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.3)", padding: "12px 16px", marginBottom: "16px" }}>
          <p className="font-body text-chaos-orange" style={{ fontSize: "0.78rem" }}>{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem" }}>Loading...</p>
      ) : data && data.payments.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(74,59,42,0.3)" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(data.payments.map((p) => p.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "left" }}>Order ID</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "left" }}>User</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "left" }}>Trip</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "right" }}>Amount</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "center" }}>Status</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "center" }}>Proof</th>
                  <th className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", padding: "10px 8px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: "1px solid rgba(74,59,42,0.15)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(payment.id)}
                        onChange={() => toggleSelect(payment.id)}
                      />
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <p className="font-body text-off-white" style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{payment.payment_order_id}</p>
                      <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem" }}>{new Date(payment.created_at).toLocaleDateString("id")}</p>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>{payment.profile?.username ?? "—"}</p>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <p className="font-body text-off-white" style={{ fontSize: "0.72rem" }}>{payment.expedition?.name ?? "—"}</p>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>{formatted(payment.amount_idr)}</p>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <span className="font-body font-semibold inline-block" style={{ fontSize: "0.55rem", letterSpacing: "0.08em", padding: "2px 6px", background: statusColors[payment.payment_status] ?? "#4A3B2A", color: payment.payment_status === "paid" ? "#111" : "#F0EDEA" }}>
                        {payment.payment_status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      {payment.proof_image_url ? (
                        <button
                          onClick={() => setPreviewImage(payment.proof_image_url!)}
                          className="font-body text-neon-green hover:text-off-white transition-colors"
                          style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}
                        >
                          View
                        </button>
                      ) : (
                        <span className="font-body text-muted-ink" style={{ fontSize: "0.6rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      {payment.payment_status === "waiting_verification" && (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleAction(payment.id, "verify")}
                            disabled={processing}
                            className="font-body font-semibold"
                            style={{ fontSize: "0.6rem", padding: "4px 10px", background: "#9BFF3C", color: "#111", border: "none", cursor: "pointer" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionTarget(payment.id)}
                            className="font-body font-semibold"
                            style={{ fontSize: "0.6rem", padding: "4px 10px", background: "#7A2E12", color: "#F0EDEA", border: "none", cursor: "pointer" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {payment.payment_status === "paid" && (
                        <button
                          onClick={() => handleAction(payment.id, "refund", { reason: "Refund admin" })}
                          disabled={processing}
                          className="font-body font-semibold"
                          style={{ fontSize: "0.6rem", padding: "4px 10px", background: "transparent", border: "1px solid rgba(255,107,26,0.4)", color: "#FF6B1A", cursor: "pointer" }}
                        >
                          Refund
                        </button>
                      )}
                      {payment.payment_status === "cancelled" && (
                        <button
                          onClick={() => handleAction(payment.id, "refund", { reason: "Refund admin" })}
                          disabled={processing}
                          className="font-body font-semibold"
                          style={{ fontSize: "0.6rem", padding: "4px 10px", background: "#FF6B1A", color: "#111", border: "none", cursor: "pointer" }}
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="font-body"
              style={{ fontSize: "0.72rem", padding: "6px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", cursor: "pointer", opacity: page <= 1 ? 0.5 : 1 }}
            >
              ← Prev
            </button>
            <span className="font-body text-muted-ink" style={{ fontSize: "0.78rem", padding: "6px 0" }}>
              {data.page} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="font-body"
              style={{ fontSize: "0.72rem", padding: "6px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", color: "#F0EDEA", cursor: "pointer", opacity: page >= data.totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem" }}>No payment data found.</p>
        </div>
      )}

      {/* Reject Modal */}
      {actionTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.4)", padding: "32px", maxWidth: "400px", width: "90%" }}>
            <h3 className="font-display font-bold uppercase text-off-white" style={{ fontSize: "1rem", marginBottom: "16px" }}>Reject Payment</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
              rows={3}
              className="font-body text-off-white placeholder:text-muted-ink"
              style={{ width: "100%", background: "#111", border: "1px solid rgba(74,59,42,0.4)", padding: "10px", fontSize: "0.78rem", color: "#F0EDEA", resize: "none" }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={() => handleAction(actionTarget, "reject", { reason: rejectReason || "Invalid proof" })}
                disabled={processing}
                className="font-body font-semibold"
                style={{ fontSize: "0.68rem", padding: "10px 20px", background: "#7A2E12", color: "#F0EDEA", border: "none", cursor: "pointer" }}
              >
                {processing ? "..." : "REJECT"}
              </button>
              <button
                onClick={() => { setActionTarget(null); setRejectReason(""); }}
                className="font-body text-muted-ink hover:text-off-white transition-colors"
                style={{ fontSize: "0.68rem", background: "none", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "pointer" }} onClick={() => setPreviewImage(null)}>
          <Image src={previewImage} alt="Payment proof" width={500} height={700} className="object-contain" style={{ maxWidth: "90vw", maxHeight: "90vh" }} />
        </div>
      )}
    </>
  );
}
