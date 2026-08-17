"use client";

import { useState } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

export function ReceiptFormatEditor({
  action,
  jurisdiction,
  jurisdictionName,
  issuerName,
  initial,
}: {
  action: ServerAction;
  jurisdiction: "PK" | "SA" | "CN";
  jurisdictionName: string;
  issuerName: string;
  initial: any;
}) {
  const [format, setFormat] = useState({
    formatName: initial?.format_name || `${jurisdictionName} receipt`,
    heading: initial?.heading || "Official Payment Receipt",
    paidLabel: initial?.subheading || "PAID - PAYMENT CONFIRMED",
    primaryColor: initial?.primary_color || "#0F172A",
    accentColor: initial?.accent_color || "#1D4ED8",
    footerText: initial?.footer_text || "Thank you for your payment.",
    fontFamily: initial?.font_family || "sans",
    layoutStyle: initial?.layout_style || "classic",
  });

  return (
    <form action={action} className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-[0.85fr_1.15fr]">
      <input type="hidden" name="jurisdiction" value={jurisdiction} />
      <div className="space-y-3">
        <h2 className="text-xl font-black">{jurisdictionName}</h2>
        <label className="grid gap-1 text-xs font-black text-slate-600">Format name<input name="format_name" value={format.formatName} onChange={(event) => setFormat({ ...format, formatName: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black text-slate-600">Receipt heading<input name="heading" value={format.heading} onChange={(event) => setFormat({ ...format, heading: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="grid gap-1 text-xs font-black text-slate-600">Paid label<input name="subheading" value={format.paidLabel} onChange={(event) => setFormat({ ...format, paidLabel: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs font-black text-slate-600">Primary color<input name="primary_color" type="color" value={format.primaryColor} onChange={(event) => setFormat({ ...format, primaryColor: event.target.value })} className="h-10 w-full rounded-xl border p-1" /></label>
          <label className="grid gap-1 text-xs font-black text-slate-600">Accent color<input name="accent_color" type="color" value={format.accentColor} onChange={(event) => setFormat({ ...format, accentColor: event.target.value })} className="h-10 w-full rounded-xl border p-1" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs font-black text-slate-600">Font<select name="font_family" value={format.fontFamily} onChange={(event) => setFormat({ ...format, fontFamily: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="sans">Sans serif</option><option value="serif">Serif</option></select></label>
          <label className="grid gap-1 text-xs font-black text-slate-600">Layout<select name="layout_style" value={format.layoutStyle} onChange={(event) => setFormat({ ...format, layoutStyle: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="classic">Classic</option><option value="modern">Modern</option><option value="compact">Compact</option></select></label>
        </div>
        <label className="grid gap-1 text-xs font-black text-slate-600">Footer text<textarea name="footer_text" rows={3} value={format.footerText} onChange={(event) => setFormat({ ...format, footerText: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" /></label>
        <button className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">Save receipt format</button>
      </div>

      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Live preview</p>
        <article className={`mx-auto max-w-2xl rounded-xl bg-white shadow-xl ring-1 ring-slate-200 ${format.layoutStyle === "compact" ? "p-5" : "p-7"}`} style={{ color: format.primaryColor, fontFamily: format.fontFamily === "serif" ? "Georgia, serif" : "Arial, sans-serif" }}>
          <header className={`flex justify-between gap-5 ${format.layoutStyle === "modern" ? "rounded-xl p-5 text-white" : "border-b-2 pb-5"}`} style={{ borderColor: format.primaryColor, backgroundColor: format.layoutStyle === "modern" ? format.primaryColor : undefined }}>
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: format.accentColor }}>{jurisdictionName}</p><h3 className="mt-2 text-2xl font-black">{format.heading}</h3><p className="mt-2 text-xs font-black text-emerald-700">{format.paidLabel}</p></div>
            <div className="text-right text-xs"><p className="text-base font-black">{issuerName}</p><p className="mt-1 text-slate-500">Registered issuer address</p></div>
          </header>
          <section className="grid grid-cols-2 gap-5 border-b border-slate-200 py-5 text-xs"><div><p className="font-black uppercase text-slate-500">Received from</p><p className="mt-1 text-base font-black">Participant Preferred Name</p></div><div className="text-right"><p className="font-black uppercase text-slate-500">Receipt details</p><p className="mt-1 font-bold">LD-R-{jurisdiction}-2026-00000001</p><p>17 August 2026</p></div></section>
          <section className="py-6"><div className="flex justify-between gap-4 border-b pb-4"><div><p className="font-black">Sample Workshop Registration</p><p className="mt-1 text-xs text-slate-500">Confirmed training/service payment</p></div><p className="text-lg font-black">USD 100.00</p></div><div className="mt-5 flex justify-between rounded-xl px-5 py-4 text-white" style={{ backgroundColor: format.primaryColor }}><strong>Total received</strong><strong>USD 100.00</strong></div></section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-5 text-amber-950"><strong>Document classification</strong><p>Organization proof of payment. Tax-document status depends on the configured authority integration.</p></section>
          <footer className="mt-6 border-t pt-4 text-[10px] leading-5 text-slate-500"><p>{format.footerText}</p><p className="font-bold">Verification code: SAMPLE-CODE</p></footer>
        </article>
        <p className="mt-3 text-xs font-semibold text-slate-500">Saved changes apply to future receipts; issued receipts retain their saved format snapshot.</p>
      </div>
    </form>
  );
}
