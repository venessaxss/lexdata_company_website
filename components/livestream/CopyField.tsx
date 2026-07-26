"use client";

import { useState } from "react";

export default function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          readOnly
          value={value}
          type={secret ? "password" : "text"}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
