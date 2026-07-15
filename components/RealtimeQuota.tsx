"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RealtimeQuota({
  expeditionId,
  initialCount,
  quotaMax,
}: {
  expeditionId: string;
  initialCount: number;
  quotaMax: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`quota:${expeditionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expedition_members",
          filter: `expedition_id=eq.${expeditionId}`,
        },
        async () => {
          const { count: fresh } = await supabase
            .from("expedition_members")
            .select("*", { count: "exact", head: true })
            .eq("expedition_id", expeditionId)
            .in("status", ["approved", "pending_payment"]);
          if (fresh !== null) setCount(fresh);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [expeditionId]);

  const pct = Math.min((count / quotaMax) * 100, 100);
  const full = count >= quotaMax;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span className="font-body font-semibold text-muted-ink uppercase" style={{ fontSize: "0.6rem", letterSpacing: "0.12em" }}>
          QUOTA
        </span>
        <span
          className="font-body font-semibold"
          style={{ fontSize: "0.82rem", color: full ? "#FF6B1A" : "#9BFF3C" }}
        >
          {count} / {quotaMax}
        </span>
      </div>
      {/* Progress bar */}
      <div style={{ height: "3px", background: "rgba(74,59,42,0.4)", width: "100%", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: "100%",
            background: full ? "#FF6B1A" : "#9BFF3C",
            transform: `scaleX(${pct / 100})`,
            transformOrigin: "left",
            transition: "transform 0.4s ease",
          }}
        />
      </div>
      {full && (
        <p className="font-body text-chaos-orange" style={{ fontSize: "0.72rem", marginTop: "6px" }}>
          Trip is full.
        </p>
      )}
    </div>
  );
}
