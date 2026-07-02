"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export default function ExpeditionMap({ location }: { location: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || instanceRef.current) return;

      // Fix default marker icons for Next.js
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false });
      instanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Geocode via Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`)
        .then((r) => r.json())
        .then((results: { lat: string; lon: string }[]) => {
          if (!results.length) {
            map.setView([0, 0], 2);
            return;
          }
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          map.setView([lat, lon], 9);
          L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${location}</b>`)
            .openPopup();
        })
        .catch(() => map.setView([0, 0], 2));
    });

    return () => {
      if (instanceRef.current) {
        (instanceRef.current as { remove: () => void }).remove();
        instanceRef.current = null;
      }
    };
  }, [location]);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "280px",
          background: "#1a1a1a",
          border: "1px solid rgba(74,59,42,0.35)",
        }}
      />
    </>
  );
}
