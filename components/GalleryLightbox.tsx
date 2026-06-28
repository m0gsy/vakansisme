"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Photo = {
  id: string;
  image_url: string;
  caption?: string | null;
  uploader_handle?: string | null;
};

export default function GalleryLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-150"
        style={{ position: "absolute", top: "20px", right: "24px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
      >
        ✕
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }}
          className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
          style={{ position: "absolute", left: "16px", background: "none", border: "none", fontSize: "2rem", cursor: "pointer", padding: "16px" }}
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh", width: "100%", aspectRatio: "auto" }}
      >
        <Image
          src={photo.image_url}
          alt={photo.caption ?? "Gallery photo"}
          fill
          sizes="90vw"
          className="object-contain"
        />
      </div>

      {/* Meta */}
      {(photo.caption || photo.uploader_handle) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: "16px", textAlign: "center" }}
        >
          {photo.caption && (
            <p className="font-body text-off-white" style={{ fontSize: "0.9rem" }}>{photo.caption}</p>
          )}
          {photo.uploader_handle && (
            <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginTop: "4px" }}>
              {photo.uploader_handle}
            </p>
          )}
        </div>
      )}

      {/* Counter */}
      <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginTop: "12px" }}>
        {idx + 1} / {photos.length}
      </p>

      {/* Next */}
      {idx < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }}
          className="font-body font-semibold text-off-white hover:text-neon-green transition-colors duration-150"
          style={{ position: "absolute", right: "16px", background: "none", border: "none", fontSize: "2rem", cursor: "pointer", padding: "16px" }}
        >
          ›
        </button>
      )}
    </div>
  );
}
