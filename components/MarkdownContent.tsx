"use client";

import { useMemo } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true });

export default function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => marked.parse(content) as string, [content]);

  return (
    <div
      className="font-body text-off-white/75 prose-vakansisme"
      style={{ fontSize: "1rem", lineHeight: 1.85 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
