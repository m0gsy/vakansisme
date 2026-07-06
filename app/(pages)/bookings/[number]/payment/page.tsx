"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string | null;
  is_active: boolean;
};

type QrisAccount = {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
};

type PaymentDetail = {
  id: string;
  payment_order_id: string;
  amount_idr: number;
  payment_status: string;
  payment_method: string | null;
  proof_image_url: string | null;
  proof_uploaded_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const number = params.number as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [qrisAccounts, setQrisAccounts] = useState<QrisAccount[]>([]);
  const [bookingStatus, setBookingStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const bookingRes = await fetch(`/api/bookings/${number}`);

        if (!bookingRes.ok) { setError("Booking not found"); setLoading(false); return; }

        const bookingJson = await bookingRes.json();
        const paymentList = bookingJson.payments ?? [];
        setBookingStatus(bookingJson.booking?.booking_status ?? "");

        if (paymentList.length > 0) {
          setPayment(paymentList[paymentList.length - 1]);
        }

        const banksData = bookingJson.banks ?? [];
        setBanks(Array.isArray(banksData) ? banksData.filter((b: BankAccount) => b.is_active !== false) : []);

        const qrisData = bookingJson.qris_accounts ?? [];
        setQrisAccounts(Array.isArray(qrisData) ? qrisData.filter((q: QrisAccount) => q.is_active !== false) : []);

        const settings = bookingJson.settings ?? {};
        setWhatsappNumber(settings.whatsapp_number?.number ?? "");
      } catch {
        setError("Gagal memuat data pembayaran");
      }
      setLoading(false);
    }
    load();
  }, [number]);

  async function handleUploadProof() {
    if (!proofFile || !payment) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("proof", proofFile);

    const res = await fetch(`/api/payments/${payment.id}/upload-proof`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (res.ok) {
      router.refresh();
    } else {
      setError(json.error ?? "Gagal upload bukti transfer");
    }
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="font-body text-muted-ink">Memuat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-chaos-orange" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>{error}</p>
          <Link href="/trips" className="font-body font-semibold text-neon-green" style={{ fontSize: "0.78rem" }}>Kembali ke Trip Saya</Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-muted-ink" style={{ fontSize: "0.9rem", marginBottom: "16px" }}>Belum ada pembayaran</p>
          <Link href={`/bookings/${number}`} className="font-body font-semibold text-neon-green" style={{ fontSize: "0.78rem" }}>Kembali ke Booking</Link>
        </div>
      </div>
    );
  }

  const formatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payment.amount_idr);
  const isVerified = payment.payment_status === "paid";
  const isWaitingVerification = payment.payment_status === "waiting_verification" || (payment.payment_status === "pending" && payment.proof_image_url);
  const isExpired = payment.payment_status === "expired" || bookingStatus === "expired";

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-3xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <Link
          href={`/bookings/${number}`}
          className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200 inline-block mb-8"
          style={{ fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← Kembali ke Booking
        </Link>

        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "32px" }}>
          PEMBAYARAN
        </h1>

        {/* Status Banner */}
        {isVerified && (
          <div style={{ background: "rgba(155,255,60,0.1)", border: "1px solid rgba(155,255,60,0.3)", padding: "20px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-neon-green" style={{ fontSize: "0.85rem" }}>Pembayaran Dikonfirmasi ✓</p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem", marginTop: "4px" }}>Pembayaran kamu sudah diverifikasi. Selamat berpetualang!</p>
          </div>
        )}

        {isWaitingVerification && (
          <div style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.3)", padding: "20px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-chaos-orange" style={{ fontSize: "0.85rem" }}>Menunggu Verifikasi</p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem", marginTop: "4px" }}>Bukti transfer kamu sedang diperiksa oleh admin. Kami akan mengirim notifikasi setelah dikonfirmasi.</p>
          </div>
        )}

        {isExpired && (
          <div style={{ background: "rgba(122,46,18,0.2)", border: "1px solid rgba(122,46,18,0.5)", padding: "20px", marginBottom: "24px" }}>
            <p className="font-body font-semibold" style={{ fontSize: "0.85rem", color: "#FF6B1A" }}>Pembayaran Kadaluarsa</p>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.75rem", marginTop: "4px" }}>Tenggat pembayaran sudah lewat. Slot kamu telah dilepaskan.</p>
          </div>
        )}

        {/* Amount */}
        <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px", textAlign: "center" }}>
          <p className="font-body text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "8px" }}>Total Pembayaran</p>
          <p className="font-display font-black text-neon-green" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.025em" }}>
            {formatted}
          </p>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "8px" }}>
            Order: {payment.payment_order_id}
          </p>
        </div>

        {/* Bank Transfer Instructions */}
        {banks.length > 0 && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>Transfer Bank</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {banks.map((bank) => (
                <div key={bank.id} style={{ background: "#111", padding: "16px", border: "1px solid rgba(74,59,42,0.3)" }}>
                  <p className="font-body font-bold text-neon-green" style={{ fontSize: "0.9rem" }}>{bank.bank_name}</p>
                  <p className="font-body text-off-white" style={{ fontSize: "1.1rem", marginTop: "4px", fontFamily: "monospace", letterSpacing: "0.15em" }}>{bank.account_number}</p>
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem" }}>a.n. {bank.account_name}</p>
                  {bank.branch && <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "2px" }}>Cabang: {bank.branch}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QRIS */}
        {qrisAccounts.length > 0 && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>QRIS</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {qrisAccounts.map((qris) => (
                <div key={qris.id} style={{ textAlign: "center", width: "160px" }}>
                  {qris.image_url && (
                    <Image src={qris.image_url} alt={qris.name} width={160} height={160} className="object-contain" style={{ background: "#fff", padding: "8px", borderRadius: "4px" }} />
                  )}
                  <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "6px" }}>{qris.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proof Upload */}
        {!isVerified && !isExpired && (
          <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px", marginBottom: "24px" }}>
            <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "16px" }}>
              {payment.proof_image_url ? "Ganti Bukti Transfer" : "Upload Bukti Transfer"}
            </p>

            {payment.proof_image_url && (
              <div style={{ marginBottom: "16px" }}>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "6px" }}>Bukti sebelumnya:</p>
                <Image src={payment.proof_image_url} alt="Previous proof" width={200} height={150} className="object-cover" style={{ border: "1px solid rgba(74,59,42,0.3)", borderRadius: "4px" }} />
              </div>
            )}

            <div style={{ border: "2px dashed rgba(74,59,42,0.5)", padding: "24px", textAlign: "center", marginBottom: "16px", cursor: "pointer" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProofFile(file);
                    setProofPreview(URL.createObjectURL(file));
                  }
                }}
                style={{ display: "none" }}
                id="proof-upload"
              />
              <label htmlFor="proof-upload" style={{ cursor: "pointer", display: "block" }}>
                {proofPreview ? (
                  <Image src={proofPreview} alt="Preview" width={240} height={180} className="object-cover mx-auto" style={{ border: "1px solid rgba(74,59,42,0.3)" }} />
                ) : (
                  <div style={{ padding: "32px 0" }}>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.85rem" }}>Klik untuk upload foto bukti transfer</p>
                    <p className="font-body text-muted-ink" style={{ fontSize: "0.68rem", marginTop: "6px" }}>Format: JPG, PNG. Maks 5MB</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleUploadProof}
              disabled={!proofFile || uploading}
              className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              style={{ fontSize: "0.72rem", letterSpacing: "0.14em", padding: "14px 28px", border: "none", cursor: "pointer" }}
            >
              {uploading ? "MENGUNGGAH..." : payment.proof_image_url ? "GANTI BUKTI TRANSFER" : "UPLOAD BUKTI TRANSFER"}
            </button>

            {error && <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "8px" }}>{error}</p>}
          </div>
        )}

        {/* Payment Timeline */}
        <div style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.35)", padding: "24px" }}>
          <p className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.14em", marginBottom: "12px" }}>Riwayat Pembayaran</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>Pembayaran dibuat</p>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{new Date(payment.created_at).toLocaleDateString("id")}</p>
            </div>
            {payment.proof_uploaded_at && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p className="font-body text-off-white" style={{ fontSize: "0.78rem" }}>Bukti diupload</p>
                <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>{new Date(payment.proof_uploaded_at).toLocaleDateString("id")}</p>
              </div>
            )}
            {isVerified && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p className="font-body text-neon-green" style={{ fontSize: "0.78rem" }}>Diverifikasi ✓</p>
              </div>
            )}
          </div>
        </div>

        {/* Need Help */}
        {whatsappNumber && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.78rem", marginBottom: "8px" }}>Ada kendala? Hubungi kami</p>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=Halo%20saya%20butuh%20bantuan%20soal%20pembayaran%20${number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body font-semibold text-neon-green hover:text-off-white transition-colors duration-150"
              style={{ fontSize: "0.85rem" }}
            >
              WhatsApp Admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
