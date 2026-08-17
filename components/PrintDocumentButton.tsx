"use client";

export default function PrintDocumentButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
