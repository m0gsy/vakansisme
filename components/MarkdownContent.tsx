"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true });

export default function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(content) as string, { USE_PROFILES: { html: true } }),
    [content]
  );

  return (
    <div
      className="font-body text-off-white/75 prose-vakansisme"
      style={{ fontSize: "1rem", lineHeight: 1.85 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
