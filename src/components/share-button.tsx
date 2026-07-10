"use client";

import { Check, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/30"
    >
      {copied ? <Check size={18} /> : <LinkIcon size={18} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
