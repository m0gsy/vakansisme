"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type Props = {
  folder: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
};

export default function ImageUpload({ folder, onUpload, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Images only (JPEG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Max 5 MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Login required"); setUploading(false); return; }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    onUpload(publicUrl);
    setUploading(false);
  }

  function handleFile(file: File | undefined) {
    if (file) upload(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${dragOver ? "#9BFF3C" : "rgba(74,59,42,0.5)"}`,
          padding: "0",
          cursor: "pointer",
          transition: "border-color 0.2s",
          position: "relative",
          minHeight: preview ? "0" : "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {preview ? (
          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            <Image
              src={preview}
              alt="Cover preview"
              fill
              sizes="100vw"
              className="object-cover"
              style={{ filter: "grayscale(10%) brightness(0.85)" }}
            />
            <div
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, background: "rgba(17,17,17,0.4)" }}
            />
            <p
              className="font-body font-semibold text-off-white/70 uppercase absolute inset-0 flex items-center justify-center"
              style={{ fontSize: "0.65rem", letterSpacing: "0.14em", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {uploading ? "UPLOADING..." : "CLICK TO CHANGE"}
            </p>
          </div>
        ) : (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p
              className="font-body font-semibold text-muted-ink uppercase"
              style={{ fontSize: "0.65rem", letterSpacing: "0.14em" }}
            >
              {uploading ? "UPLOADING..." : "DROP IMAGE OR CLICK TO UPLOAD"}
            </p>
            <p className="font-body text-muted-ink mt-1" style={{ fontSize: "0.7rem" }}>
              JPEG · PNG · WebP · GIF · max 5 MB
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="font-body text-chaos-orange mt-2" style={{ fontSize: "0.78rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
