"use client";

import { useEffect } from "react";

export default function ViewCounter({ storyId }: { storyId: string }) {
  useEffect(() => {
    void fetch(`/api/stories/${storyId}/view`, { method: "POST" });
  }, [storyId]);

  return null;
}
