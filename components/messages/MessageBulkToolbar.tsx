"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { bulkMessageAction } from "@/app/dashboard/messages/actions";

type Props = {
  returnTo: string;
  visibleCount: number;
};

function messageCheckboxes() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[data-message-checkbox="true"]'
    )
  );
}

export default function MessageBulkToolbar({
  returnTo,
  visibleCount,
}: Props) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const boxes = messageCheckboxes();

    const update = () => {
      setSelectedCount(boxes.filter((box) => box.checked).length);
    };

    for (const box of boxes) {
      box.addEventListener("change", update);
    }

    update();

    return () => {
      for (const box of boxes) {
        box.removeEventListener("change", update);
      }
    };
  }, [visibleCount]);

  function setAll(checked: boolean) {
    const boxes = messageCheckboxes();

    for (const box of boxes) {
      box.checked = checked;
      box.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function confirmDelete(event: MouseEvent<HTMLButtonElement>) {
    if (
      !window.confirm(
        `Delete ${selectedCount} selected message${
          selectedCount === 1 ? "" : "s"
        }? This cannot be undone.`
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <form
        id="bulk-message-form"
        action={bulkMessageAction}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <input type="hidden" name="return_to" value={returnTo} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAll(true)}
            disabled={visibleCount === 0}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select page
          </button>

          <button
            type="button"
            onClick={() => setAll(false)}
            disabled={selectedCount === 0}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>

          <span className="text-sm font-bold text-slate-500">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            name="bulk_action"
            value="read"
            disabled={selectedCount === 0}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark read
          </button>

          <button
            name="bulk_action"
            value="unread"
            disabled={selectedCount === 0}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark unread
          </button>

          <button
            name="bulk_action"
            value="delete"
            disabled={selectedCount === 0}
            onClick={confirmDelete}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete selected
          </button>
        </div>
      </form>
    </section>
  );
}
