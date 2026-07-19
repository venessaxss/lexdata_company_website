"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { reorderTeamMembers } from "@/app/admin/team/actions";

type TeamOrderItem = {
  id: string;
  name: string;
  role?: string | null;
  section?: string | null;
  photo?: string | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
};

type Props = {
  members: TeamOrderItem[];
  returnTo?: string;
};

export default function TeamOrderManager({
  members,
  returnTo = "/manager/team",
}: Props) {
  const [items, setItems] = useState(members);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const orderJson = useMemo(() => {
    return JSON.stringify(
      items.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }))
    );
  }, [items]);

  function moveItem(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    const next = [...items];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    setItems(next);
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    moveItem(index, index - 1);
  }

  function moveDown(index: number) {
    if (index >= items.length - 1) return;
    moveItem(index, index + 1);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
            Homepage Team Order
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Drag team members to reorder
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Admins and managers can control the order shown on the homepage and
            team page.
          </p>
        </div>

        <form action={reorderTeamMembers}>
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="order" value={orderJson} />

          <button
            type="submit"
            className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
          >
            Save Order
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((member, index) => (
          <div
            key={member.id}
            draggable
            onDragStart={() => setDraggedId(member.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              const fromIndex = items.findIndex(
                (item) => item.id === draggedId
              );
              moveItem(fromIndex, index);
              setDraggedId(null);
            }}
            className="flex cursor-move items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-blue-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                {index + 1}
              </div>

              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-lg font-black text-slate-500">
                  {member.name.slice(0, 1)}
                </div>
              )}

              <div>
                <p className="font-black text-slate-950">{member.name}</p>

                <p className="text-sm font-semibold text-slate-600">
                  {member.role || "Team Member"}
                </p>

                <p className="text-xs font-bold text-slate-400">
                  {member.section || "Team"} ·{" "}
                  {member.is_active ? "Active" : "Hidden"} ·{" "}
                  {member.is_featured ? "Homepage" : "Not featured"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveUp(index)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white"
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() => moveDown(index)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white"
              >
                ↓
              </button>

              <Link
                href={`/manager/team/${member.id}/edit`}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-700"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}