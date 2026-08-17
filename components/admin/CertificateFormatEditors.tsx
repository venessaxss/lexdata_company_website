"use client";

import { useEffect, useState } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

type FormatState = {
  templateName: string;
  textColor: string;
  nameTop: number;
  programTop: number;
  detailsTop: number;
  nameSize: number;
  programSize: number;
  detailsSize: number;
  nameFontFamily: "serif" | "sans";
  completionLabel: string;
};

const defaultFormat: FormatState = {
  templateName: "New certificate format",
  textColor: "#0B2545",
  nameTop: 45,
  programTop: 61,
  detailsTop: 81,
  nameSize: 64,
  programSize: 30,
  detailsSize: 12,
  nameFontFamily: "serif",
  completionLabel: "Successfully completed",
};

function fontFamily(value: FormatState["nameFontFamily"]) {
  if (value === "sans") return "Arial, sans-serif";
  return "Georgia, serif";
}

function CertificatePreview({
  backgroundUrl,
  format,
}: {
  backgroundUrl?: string;
  format: FormatState;
}) {
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf7] shadow-lg">
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt="Certificate format preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-3 border-2 border-[#b08d39]">
          <div className="absolute inset-2 border border-[#d8bf77]" />
        </div>
      )}
      <div
        className="absolute left-[7%] right-[7%] -translate-y-1/2 text-center font-bold leading-tight"
        style={{
          top: `${format.nameTop}%`,
          color: format.textColor,
          fontFamily: fontFamily(format.nameFontFamily),
          fontSize: `${Math.max(15, format.nameSize * 0.42)}px`,
        }}
      >
        Participant Preferred Name
      </div>
      <div
        className="absolute left-[10%] right-[10%] -translate-y-1/2 text-center"
        style={{ top: `${format.programTop}%`, color: format.textColor }}
      >
        <p className="text-[8px] font-semibold uppercase tracking-[0.18em] opacity-75">
          {format.completionLabel}
        </p>
        <p
          className="mt-1 font-black leading-tight"
          style={{ fontSize: `${Math.max(11, format.programSize * 0.42)}px` }}
        >
          Sample Workshop Title
        </p>
      </div>
      <div
        className="absolute left-[7%] right-[7%] -translate-y-1/2 text-center font-semibold"
        style={{
          top: `${format.detailsTop}%`,
          color: format.textColor,
          fontSize: `${Math.max(7, format.detailsSize * 0.65)}px`,
        }}
      >
        17 August 2026 | LD-C-PK-2026-00000001 | Pakistan
        <div className="mt-1 opacity-70">Verify: lexdata.example/verify/sample</div>
      </div>
    </div>
  );
}

function FormatControls({
  format,
  setFormat,
}: {
  format: FormatState;
  setFormat: (next: FormatState) => void;
}) {
  const numberField = (
    key: keyof Pick<
      FormatState,
      "nameTop" | "programTop" | "detailsTop" | "nameSize" | "programSize" | "detailsSize"
    >,
    label: string,
    min: number,
    max: number
  ) => (
    <label className="grid gap-1 text-xs font-black text-slate-600">
      {label}
      <input
        name={
          key === "nameTop"
            ? "name_top_percent"
            : key === "programTop"
              ? "program_top_percent"
              : key === "detailsTop"
                ? "details_top_percent"
                : key === "nameSize"
                  ? "name_font_size"
                  : key === "programSize"
                    ? "program_font_size"
                    : "details_font_size"
        }
        type="number"
        min={min}
        max={max}
        value={format[key]}
        onChange={(event) =>
          setFormat({ ...format, [key]: Number(event.target.value) })
        }
        className="rounded-xl border border-slate-300 px-3 py-2"
      />
    </label>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs font-black text-slate-600 sm:col-span-2 lg:col-span-3">
        Completion label
        <input
          name="completion_label"
          value={format.completionLabel}
          onChange={(event) => setFormat({ ...format, completionLabel: event.target.value })}
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-slate-600">
        Text color
        <input
          name="text_color"
          type="color"
          value={format.textColor}
          onChange={(event) => setFormat({ ...format, textColor: event.target.value })}
          className="h-10 w-full rounded-xl border border-slate-300 p-1"
        />
      </label>
      <label className="grid gap-1 text-xs font-black text-slate-600">
        Name font
        <select
          name="font_family"
          value={format.nameFontFamily}
          onChange={(event) =>
            setFormat({
              ...format,
              nameFontFamily: event.target.value as FormatState["nameFontFamily"],
            })
          }
          className="rounded-xl border border-slate-300 px-3 py-2"
        >
          <option value="serif">Formal serif</option>
          <option value="sans">Clean sans serif</option>
        </select>
      </label>
      {numberField("nameTop", "Name vertical %", 20, 75)}
      {numberField("programTop", "Program vertical %", 35, 85)}
      {numberField("detailsTop", "Details vertical %", 55, 94)}
      {numberField("nameSize", "Name size", 28, 96)}
      {numberField("programSize", "Program size", 16, 56)}
      {numberField("detailsSize", "Details size", 8, 20)}
    </div>
  );
}

export function CertificateTemplateUploadEditor({
  action,
  workshops,
}: {
  action: ServerAction;
  workshops: Array<{ id: string; title: string | null }>;
}) {
  const [format, setFormat] = useState(defaultFormat);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return (
    <form action={action} className="mt-5 grid gap-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm xl:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-4">
        <label className="grid gap-2 text-sm font-black">
          Workshop
          <select name="workshop_id" required className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="">Select workshop</option>
            {workshops.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.title || "Untitled workshop"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black">
          Template name
          <input
            name="template_name"
            required
            value={format.templateName}
            onChange={(event) => setFormat({ ...format, templateName: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-black">
          Certificate background image
          <input
            name="template_file"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="rounded-xl border border-dashed border-slate-400 bg-slate-50 px-4 py-4"
          />
        </label>
        <FormatControls format={format} setFormat={setFormat} />
        <button className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
          Upload and activate certificate format
        </button>
      </div>
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Live preview</p>
        <CertificatePreview backgroundUrl={previewUrl} format={format} />
        <p className="mt-3 text-xs font-semibold text-slate-500">Preview uses sample participant and workshop data.</p>
      </div>
    </form>
  );
}

export function ActiveCertificateFormatEditor({
  action,
  template,
}: {
  action: ServerAction;
  template: any;
}) {
  const [format, setFormat] = useState<FormatState>({
    templateName: template.template_name || "Certificate template",
    textColor: template.text_color || "#0B2545",
    nameTop: Number(template.name_top_percent || 45),
    programTop: Number(template.program_top_percent || 61),
    detailsTop: Number(template.details_top_percent || 81),
    nameSize: Number(template.name_font_size || 64),
    programSize: Number(template.program_font_size || 30),
    detailsSize: Number(template.details_font_size || 12),
    nameFontFamily: template.font_family || "serif",
    completionLabel: template.completion_label || "Successfully completed",
  });

  return (
    <form action={action} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1.1fr_0.9fr]">
      <input type="hidden" name="template_id" value={template.id} />
      <div>
        <CertificatePreview backgroundUrl={template.background_url} format={format} />
      </div>
      <div className="space-y-4">
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Active</span>
          <label className="mt-3 grid gap-1 text-xs font-black text-slate-600">
            Template name
            <input
              name="template_name"
              value={format.templateName}
              onChange={(event) => setFormat({ ...format, templateName: event.target.value })}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <FormatControls format={format} setFormat={setFormat} />
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
          Save certificate format
        </button>
      </div>
    </form>
  );
}
