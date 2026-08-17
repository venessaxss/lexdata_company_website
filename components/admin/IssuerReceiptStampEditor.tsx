type ServerAction = (
  formData: FormData
) => void | Promise<void>;

export function IssuerReceiptStampEditor({
  jurisdiction,
  jurisdictionName,
  issuerName,
  stampUrl,
  stampEnabled,
  uploadAction,
  removeAction,
}: {
  jurisdiction: "PK" | "SA" | "CN";
  jurisdictionName: string;
  issuerName: string;
  stampUrl?: string | null;
  stampEnabled?: boolean | null;
  uploadAction: ServerAction;
  removeAction: ServerAction;
}) {
  const active =
    Boolean(stampEnabled) &&
    Boolean(stampUrl);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            {jurisdictionName} issuer stamp
          </p>

          <h3 className="mt-2 text-xl font-black">
            {issuerName}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This stamp is stored on the issuer profile and is snapshotted
            into newly issued receipts. Replacing or disabling it does not
            modify receipts that were already issued.
          </p>
        </div>

        <span
          className={`h-fit rounded-full px-3 py-1 text-xs font-black ${
            active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {active ? "Stamp active" : "No active stamp"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          {active && stampUrl ? (
            <img
              src={stampUrl}
              alt={`${issuerName} receipt stamp`}
              className="max-h-40 max-w-full object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          ) : (
            <p className="text-center text-sm font-bold text-slate-400">
              No stamp uploaded
            </p>
          )}
        </div>

        <div className="space-y-4">
          <form
            action={uploadAction}
            encType="multipart/form-data"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <input
              type="hidden"
              name="jurisdiction"
              value={jurisdiction}
            />

            <label className="grid gap-2 text-sm font-black text-slate-700">
              Upload official issuer stamp
              <input
                type="file"
                name="stamp_file"
                accept="image/png,image/jpeg,image/webp"
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              PNG, JPG, or WebP; maximum 5 MB. A tightly cropped transparent
              PNG gives the cleanest printed result. A normal stamp photo is
              also accepted.
            </p>

            <button className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white">
              {active ? "Replace active stamp" : "Upload and activate stamp"}
            </button>
          </form>

          {active ? (
            <form action={removeAction}>
              <input
                type="hidden"
                name="jurisdiction"
                value={jurisdiction}
              />

              <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700">
                Disable stamp for future receipts
              </button>

              <p className="mt-2 text-xs text-slate-500">
                Existing issued receipts keep their saved stamp snapshot.
              </p>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}