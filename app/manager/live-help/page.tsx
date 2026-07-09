import { createAdminClient } from "@/lib/supabase/admin";
import { answerLiveQaRequestAction } from "@/app/live-qa/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function label(status?: string | null) {
  if (!status) return "Open";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function badge(status?: string | null) {
  if (status === "answered") return "bg-emerald-50 text-emerald-700";
  if (status === "closed") return "bg-slate-100 text-slate-700";
  return "bg-amber-50 text-amber-700";
}

export default async function ManagerLiveHelpPage() {
  const admin = createAdminClient();

  const { data: requests, error } = await admin
    .from("live_qa_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Live Q&A Help Desk
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review participant help requests and reply from here.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Failed to load Q&A requests: {error.message}
          </div>
        ) : null}

        {(requests ?? []).length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-400 shadow-sm ring-1 ring-slate-200">
            No Q&A requests yet.
          </div>
        ) : null}

        <div className="space-y-5">
          {(requests ?? []).map((item: any) => (
            <article
              key={item.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                    {item.category || "General Help"}
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    {item.name || "Unnamed participant"}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item.email || "No email provided"}
                  </p>

                  {item.page_path ? (
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      From page: {item.page_path}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`h-fit rounded-full px-4 py-2 text-xs font-black ${badge(
                    item.status
                  )}`}
                >
                  {label(item.status)}
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  Question
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {item.question}
                </p>
              </div>

              {item.answer ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase text-emerald-700">
                    Current Answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-900">
                    {item.answer}
                  </p>
                </div>
              ) : null}

              <form
                action={answerLiveQaRequestAction}
                className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <input type="hidden" name="id" value={item.id} />

                <label className="block text-sm font-black text-slate-600">
                  Reply / Answer
                </label>
                <textarea
                  name="answer"
                  defaultValue={item.answer || ""}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
                />

                <label className="mt-4 block text-sm font-black text-slate-600">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={item.status || "open"}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold"
                >
                  <option value="open">Open</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  type="submit"
                  className="mt-4 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-700"
                >
                  Save reply
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
