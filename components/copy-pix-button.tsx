"use client";

import { useState } from "react";

export function CopyPixButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <button className="btn btn-primary" type="button" onClick={copy}>{copied ? "Copiado ✓" : "Copiar código Pix"}</button>;
}
