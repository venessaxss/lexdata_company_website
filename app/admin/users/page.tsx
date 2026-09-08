export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  APP_ROLES,
  ROLE_LABELS,
  type AppRole,
  normalizeRole,
} from "@/lib/roles";
import { updateUserRole } from "./actions";

const PAGE_SIZE = 25;
const AUTH_PAGE_SIZE = 1000;
const ROLE_SORT_ORDER: AppRole[] = [
  "admin",
  "manager",
  "staff",
  "speaker",
  "member",
];

const ROLE_STYLES: Record<AppRole, string> = {
  admin: "bg-rose-100 text-rose-800 ring-rose-200",
  manager: "bg-violet-100 text-violet-800 ring-violet-200",
  staff: "bg-amber-100 text-amber-800 ring-amber-200",
  speaker: "bg-sky-100 text-sky-800 ring-sky-200",
  member: "bg-slate-100 text-slate-700 ring-slate-200",
};

type SearchParams = {
  message?: string;
  page?: string;
  role?: string;
  q?: string;
};

function safePage(value?: string) {
  const parsed = Number(value || "1");
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

function selectedRole(value?: string): AppRole | "all" {
  return APP_ROLES.includes(value as AppRole) ? (value as AppRole) : "all";
}

function usersHref(input: {
  page?: number;
  role: AppRole | "all";
  q: string;
}) {
  const params = new URLSearchParams();

  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.role !== "all") params.set("role", input.role);
  if (input.q) params.set("q", input.q);

  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const activeRole = selectedRole(params.role);
  const searchText = String(params.q || "").trim();
  const supabaseAdmin = createAdminClient();
  const users = [];

  for (let authPage = 1; ; authPage += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: authPage,
      perPage: AUTH_PAGE_SIZE,
    });

    if (error) throw new Error(error.message);

    users.push(...data.users);

    if (data.users.length < AUTH_PAGE_SIZE) break;
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role");

  if (profilesError) {
    throw new Error(`Unable to load user roles: ${profilesError.message}`);
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  const roleCounts = Object.fromEntries(
    APP_ROLES.map((role) => [role, 0])
  ) as Record<AppRole, number>;

  const normalizedUsers = users.map((user) => {
    const profile = profileMap.get(user.id);
    const role = normalizeRole(profile?.role);

    roleCounts[role] += 1;

    return {
      user,
      profile,
      role,
      searchValue: `${user.email || ""} ${profile?.full_name || ""} ${user.id}`.toLowerCase(),
    };
  });

  const normalizedSearch = searchText.toLowerCase();
  const filteredUsers = normalizedUsers
    .filter((item) => activeRole === "all" || item.role === activeRole)
    .filter((item) => !normalizedSearch || item.searchValue.includes(normalizedSearch))
    .sort((left, right) => {
      const roleDifference =
        ROLE_SORT_ORDER.indexOf(left.role) - ROLE_SORT_ORDER.indexOf(right.role);

      if (roleDifference !== 0) return roleDifference;

      const leftName = left.profile?.full_name || left.user.email || left.user.id;
      const rightName = right.profile?.full_name || right.user.email || right.user.id;
      return leftName.localeCompare(rightName, undefined, { sensitivity: "base" });
    });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const page = Math.min(safePage(params.page), totalPages);
  const firstResult = filteredUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, filteredUsers.length);
  const visibleUsers = filteredUsers.slice(firstResult ? firstResult - 1 : 0, lastResult);
  const currentReturnTo = usersHref({ page, role: activeRole, q: searchText });

  const filters: Array<{ value: AppRole | "all"; label: string; count: number }> = [
    { value: "all", label: "All roles", count: users.length },
    ...ROLE_SORT_ORDER.map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      count: roleCounts[role],
    })),
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Users and Roles
        </h1>
        <p className="mt-2 text-slate-600">
          Users are automatically grouped by role and sorted by name within each role.
        </p>
      </div>

      {params.message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {params.message}
        </div>
      ) : null}

      <section aria-label="Filter users by role" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {filters.map((filter) => {
          const isActive = activeRole === filter.value;

          return (
            <Link
              key={filter.value}
              prefetch={false}
              href={usersHref({ page: 1, role: filter.value, q: searchText })}
              className={`rounded-2xl border px-4 py-4 transition ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <span className="block text-xs font-bold uppercase tracking-[0.12em] opacity-70">
                {filter.label}
              </span>
              <strong className="mt-1 block text-2xl">{filter.count}</strong>
            </Link>
          );
        })}
      </section>

      <form action="/admin/users" className="mb-6 flex flex-col gap-3 sm:flex-row">
        {activeRole !== "all" ? (
          <input type="hidden" name="role" value={activeRole} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={searchText}
          placeholder="Search by name, email, or user ID"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-600"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          Search
        </button>
        {searchText ? (
          <Link
            prefetch={false}
            href={usersHref({ page: 1, role: activeRole, q: "" })}
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Current role</th>
              <th className="px-4 py-3">Change role</th>
            </tr>
          </thead>

          <tbody>
            {visibleUsers.map(({ user, profile, role }) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{user.email}</div>
                  <div className="text-xs text-slate-500">{user.id}</div>
                </td>

                <td className="px-4 py-4 text-slate-700">
                  {profile?.full_name ?? "-"}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${ROLE_STYLES[role]}`}
                  >
                    {ROLE_LABELS[role]}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={user.id} />
                    <input type="hidden" name="return_to" value={currentReturnTo} />

                    <select
                      name="role"
                      defaultValue={role}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      {APP_ROLES.map((optionRole) => (
                        <option key={optionRole} value={optionRole}>
                          {ROLE_LABELS[optionRole]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Update
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                  No users match this role and search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">
          Showing {firstResult}–{lastResult} of {filteredUsers.length} users · Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <Link
            prefetch={false}
            href={usersHref({ page: Math.max(1, page - 1), role: activeRole, q: searchText })}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              page <= 1
                ? "pointer-events-none bg-slate-100 text-slate-400"
                : "bg-slate-950 text-white hover:bg-slate-700"
            }`}
          >
            Previous
          </Link>
          <Link
            prefetch={false}
            href={usersHref({ page: Math.min(totalPages, page + 1), role: activeRole, q: searchText })}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              page >= totalPages
                ? "pointer-events-none bg-slate-100 text-slate-400"
                : "bg-slate-950 text-white hover:bg-slate-700"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}
