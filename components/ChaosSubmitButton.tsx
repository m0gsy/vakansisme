"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { CHAOS_TYPES } from "@/types/chaos";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ChaosSubmitButton({
  variant = "orange",
}: {
  variant?: "orange" | "green";
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<string>(CHAOS_TYPES[0]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleOpenModal() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const res = await fetch("/api/chaos/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, caption, image_url: imageUrl || undefined }),
    });
    const json = await res.json();

    if (res.ok) {
      setCaption("");
      setImageUrl("");
      setType(CHAOS_TYPES[0]);
      setModalOpen(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } else {
      setSubmitError(json.error ?? "Something went wrong");
    }
    setSubmitting(false);
  }

  const btnBg = variant === "green" ? "#9BFF3C" : "#FF6B1A";
  const btnHover = variant === "green" ? "hover:bg-chaos-orange" : "hover:bg-neon-green";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <button
        onClick={handleOpenModal}
        className={`font-body font-semibold text-charcoal ${btnHover} transition-colors duration-200`}
        style={{ background: btnBg, fontSize: "0.72rem", letterSpacing: "0.14em", padding: "13px 36px", border: "none", cursor: "pointer" }}
      >
        SUBMIT YOUR CHAOS →
      </button>

      <AnimatePresence>
        {submitted && (
          <motion.p
            key="chaos-toast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-body font-semibold text-charcoal"
            style={{ display: "inline-block", background: "#9BFF3C", fontSize: "0.7rem", letterSpacing: "0.12em", padding: "9px 18px" }}
          >
            SUBMITTED — pending review.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="chaos-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease }}
              style={{ background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.5)", padding: "40px", width: "100%", maxWidth: "480px" }}
            >
              <h3
                className="font-display font-black uppercase text-off-white"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.02em", marginBottom: "8px" }}
              >
                SUBMIT YOUR CHAOS
              </h3>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.82rem", marginBottom: "32px" }}>
                Goes live after a quick review. No curation. Just the truth.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="font-body text-off-white w-full focus:outline-none"
                    style={{ background: "#111111", border: "1px solid rgba(74,59,42,0.5)", padding: "10px 12px", fontSize: "0.88rem", cursor: "pointer" }}
                  >
                    {CHAOS_TYPES.map((t) => (
                      <option key={t} value={t} style={{ background: "#111111" }}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
                    Caption <span style={{ textTransform: "none", letterSpacing: 0 }}>({caption.length}/280)</span>
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    required
                    maxLength={280}
                    rows={4}
                    placeholder="What happened out there?"
                    className="font-story text-off-white placeholder:text-muted-ink w-full focus:outline-none resize-none"
                    style={{ background: "transparent", border: "none", borderBottom: "2px solid #4A3B2A", padding: "10px 0", fontSize: "0.9rem", transition: "border-color 0.2s" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#9BFF3C")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#4A3B2A")}
                  />
                </div>

                <div>
                  <label className="font-body font-semibold text-muted-ink uppercase block mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>
                    Photo <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <ImageUpload folder="chaos" onUpload={setImageUrl} currentUrl={imageUrl} />
                </div>

                {submitError && (
                  <p className="font-body text-chaos-orange" style={{ fontSize: "0.82rem" }}>{submitError}</p>
                )}

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="submit"
                    disabled={submitting || !caption.trim()}
                    className="font-body font-semibold text-charcoal bg-neon-green hover:bg-chaos-orange transition-colors duration-150 disabled:opacity-50"
                    style={{ fontSize: "0.7rem", letterSpacing: "0.14em", padding: "12px 28px", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}
                  >
                    {submitting ? "SUBMITTING..." : "SUBMIT"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
                    style={{ fontSize: "0.7rem", letterSpacing: "0.14em", padding: "12px 20px", background: "none", border: "none", cursor: "pointer" }}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
