"use client";

import dynamic from "next/dynamic";

const ExpeditionMap = dynamic(() => import("@/components/ExpeditionMap"), { ssr: false });

export default function ExpeditionMapClient({ location }: { location: string }) {
  return <ExpeditionMap location={location} />;
}
