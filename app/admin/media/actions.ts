
the original team members cannot be found; Leadership & Team
Executive Leadership

Dr. Muhammad Afzaal – Founder and CEO
Dr. Muhammad Ali Asiri – Co-Founder

Advisory Board

Dr. Muhammad Imran – Scientific Advisor
Professor Dr. Mamoona Khan – Scientific Advisor
Dr. Muhammad Younis – Education & Curriculum Advisor
Dr. Rafi Ullah (University of Liverpool) – AI & Python Trainer and Advisor
Dr. Muhammad Faseeh ( National Unievrsity of JEJU, South Korea, Advisor & Python Trainer) 
Core Team

Syedah Nobia – Coordinator
Xiao Shanshan – Lead Technical Coordinator i want these to be our team, once click on the link of profile, their info can be show, this main team needs to remain in the website i can edit them (photo, bios, ..etc from admin and manager side (

i mean homepage background photo like this , i want to make lively, modifiable or even submit my own photoes, make it dynamic, automatically scrolling

why there are 2

still it is like this, the video link cannot be processed

why can't i update this info from the workshop page

still this part is not updated and i need to add registration as well 

and this one cannot be updated

this is my setting, tell me how can i make sure dashboard links to this page 

Thought for 5s
Replace this file:

app/dashboard/page.tsx
with this full code:

import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dashboardCards = [
  {
    title: "My Learning",
    description:
      "View your registered workshops, payment status, and unlocked session arrangements.",
    href: "/dashboard/my-learning",
  },
  {
    title: "Message Box",
    description:
      "Check payment links, workshop updates, and next-step messages from LexData.",
    href: "/dashboard/messages",
  },
  {
    title: "Browse Workshops",
    description:
      "Explore available LexData workshops and register for new training programs.",
    href: "/workshops",
  },
  {
    title: "Browse Courses",
    description:
      "Explore LexData courses, learning paths, and research training programs.",
    href: "/courses",
  },
  {
    title: "Payment",
    description:
      "View payment-related information and continue payment steps when available.",
    href: "/payment",
  },
  {
    title: "My Profile",
    description:
      "View or update your member profile and account information.",
    href: "/my",
  },
];

export default async function DashboardPage() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10 rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Member Dashboard
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
          Welcome back{displayName ? `, ${displayName}` : ""}
        </h1>

        <p className="mt-4 max-w-2xl text-slate-300">
          Manage your learning, workshop registrations, payment steps, and
          LexData messages from one place.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/my-learning"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
          >
            Open My Learning
          </Link>

          <Link
            href="/dashboard/messages"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Open Message Box
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-xl font-black text-slate-950">
              {card.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              {card.description}
            </p>

            <span className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              Open
            </span>
          </Link>
        ))}
      </section>

      {profile?.role === "admin" || profile?.role === "manager" ? (
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Staff shortcuts
          </h2>

          <p className="mt-3 text-slate-600">
            Your account has staff access. Use these shortcuts to manage
            workshop registrations and website content.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Admin Dashboard
                </Link>

                <Link
                  href="/admin/registrations"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Registration Records
                </Link>
              </>
            ) : null}

            {profile.role === "manager" ? (
              <>
                <Link
                  href="/manager"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Manager Dashboard
                </Link>

                <Link
                  href="/manager/registrations"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Registration Records
                </Link>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
Then run:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Fix dashboard my learning link"
git push origin main

i cannot click on the workshop page from here 

Thought for 10s
The page in your screenshot is not the new /dashboard/my-learning page. It is another old “Registered workshops” page.

First find the real file:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

grep -R "Registered workshops\|Live sessions and training workshops\|Workshop page" app components
The result will probably be something like:

app/my/workshops/page.tsx
or:

app/my/page.tsx
Replace the file that appears in the grep result with this full code.

import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegisteredWorkshop = {
  id: string;
  workshop_id?: string | null;
  workshop_slug?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  created_at?: string | null;
  workshops?: {
    id?: string | null;
    title?: string | null;
    slug?: string | null;
    level?: string | null;
    language?: string | null;
    short_description?: string | null;
    summary?: string | null;
    start_date?: string | null;
    date?: string | null;
    duration?: string | null;
    format?: string | null;
    image_url?: string | null;
    cover_url?: string | null;
    thumbnail_url?: string | null;
  } | null;
};

function getWorkshopSlug(item: RegisteredWorkshop) {
  return item.workshops?.slug || item.workshop_slug || null;
}

function getWorkshopTitle(item: RegisteredWorkshop) {
  return item.workshops?.title || "Workshop";
}

function getWorkshopDescription(item: RegisteredWorkshop) {
  return (
    item.workshops?.short_description ||
    item.workshops?.summary ||
    "Workshop details will be updated soon."
  );
}

function getWorkshopDate(item: RegisteredWorkshop) {
  return item.workshops?.start_date || item.workshops?.date || "TBA";
}

function getWorkshopTimeText(item: RegisteredWorkshop) {
  const date = getWorkshopDate(item);
  const duration = item.workshops?.duration;

  if (duration && date !== "TBA") {
    return `${date} · ${duration}`;
  }

  if (duration) {
    return duration;
  }

  return `Time ${date}`;
}

function getCoverImage(item: RegisteredWorkshop) {
  return (
    item.workshops?.image_url ||
    item.workshops?.cover_url ||
    item.workshops?.thumbnail_url ||
    null
  );
}

function hasPaidAccess(item: RegisteredWorkshop) {
  return (
    item.payment_status === "confirmed" ||
    item.payment_status === "paid" ||
    item.status === "approved" ||
    item.status === "confirmed" ||
    item.status === "paid"
  );
}

export default async function RegisteredWorkshopsPage() {
  noStore();

  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workshop_registrations")
    .select(
      `
      *,
      workshops (
        id,
        title,
        slug,
        level,
        language,
        short_description,
        summary,
        start_date,
        date,
        duration,
        format,
        image_url,
        cover_url,
        thumbnail_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const registrations = (data ?? []) as RegisteredWorkshop[];

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tight text-slate-950">
          Registered workshops
        </h1>

        <p className="mt-5 text-xl text-slate-600">
          Live sessions and training workshops you registered for.
        </p>
      </div>

      {error ? (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error.message}
        </div>
      ) : null}

      {registrations.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            No registered workshops yet
          </h2>

          <p className="mt-3 text-slate-600">
            After you register for a workshop, it will appear here.
          </p>

          <Link
            href="/workshops"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Browse workshops
          </Link>
        </section>
      ) : (
        <section className="grid gap-6">
          {registrations.map((item) => {
            const slug = getWorkshopSlug(item);
            const href = slug ? `/workshops/${slug}` : null;
            const paidAccess = hasPaidAccess(item);
            const coverImage = getCoverImage(item);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={getWorkshopTitle(item)}
                      className="h-64 w-full object-cover lg:h-full"
                    />
                  ) : (
                    <div className="h-64 w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 lg:h-full" />
                  )}

                  <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                          {item.status || "registered"}
                        </span>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${
                            paidAccess
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {paidAccess ? "Access unlocked" : "Payment pending"}
                        </span>
                      </div>

                      <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                        {getWorkshopTitle(item)}
                      </h2>

                      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                        {getWorkshopDescription(item)}
                      </p>

                      <div className="mt-5 grid gap-2 text-base text-slate-600">
                        <p>
                          <strong>Time:</strong> {getWorkshopTimeText(item)}
                        </p>

                        <p>
                          <strong>Format:</strong>{" "}
                          {item.workshops?.format || "Online"}
                        </p>

                        <p>
                          <strong>Payment:</strong>{" "}
                          {item.payment_status || "pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3">
                      {href ? (
                        <Link
                          href={href}
                          className="rounded-2xl border border-slate-300 bg-white px-7 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-50"
                        >
                          Workshop page
                        </Link>
                      ) : (
                        <span className="rounded-2xl border border-slate-200 bg-slate-100 px-7 py-4 text-center text-base font-black text-slate-400">
                          Missing workshop link
                        </span>
                      )}

                      {!paidAccess ? (
                        <Link
                          href="/dashboard/messages"
                          className="rounded-2xl bg-slate-950 px-7 py-4 text-center text-base font-black text-white hover:bg-slate-700"
                        >
                          Payment message
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
Then run this SQL once, because old registration rows may not have workshop_slug:

update public.workshop_registrations wr
set workshop_slug = w.slug
from public.workshops w
where wr.workshop_id = w.id
  and (wr.workshop_slug is null or wr.workshop_slug = '');

notify pgrst, 'reload schema';
Then build and push:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Fix registered workshops page links"
git push origin main
After this, the Workshop page button will go to:

/workshops/the-real-workshop-slug
not a broken UUID or empty route.


don't lock anything for admin

Thought for 10s
Update only this file:

app/workshops/[slug]/page.tsx
You need to make admin bypass all locks.

1. Add admin role check
Find this part:

const {
  data: { user },
} = await supabase.auth.getUser();
Right below it, add:

let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";
So it becomes:

const {
  data: { user },
} = await supabase.auth.getUser();

let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";
2. Replace paid access logic
Find this:

const paidAccess = hasPaidAccess(registration);
const canSeeWorkshopCost = Boolean(registration);
Replace with this:

const paidAccess = isAdmin || hasPaidAccess(registration);
const canSeeWorkshopCost = isAdmin || Boolean(registration);
Now admin can see:

Cost
Session links
Meeting links
Materials
Recordings
Videos
even without registration or payment confirmation.

3. Add admin notice in the session arrangement section
Find this part:

{!user ? (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
Replace the whole condition start with this:

{isAdmin ? (
  <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-800">
    Admin preview mode. All workshop session links, materials, recordings,
    and videos are unlocked for this account.
  </div>
) : !user ? (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
    Please register or login as a member first. After registration
    and payment confirmation, full session links will be unlocked.
  </div>
) : registration && !paidAccess ? (
So admin sees the unlocked notice instead of the locked message.

4. Add admin notice in the registration sidebar
Find this part:

{!user ? (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
Replace it with:

{isAdmin ? (
  <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
    <p className="font-semibold text-purple-800">
      Admin access enabled.
    </p>

    <p className="mt-2 text-sm leading-6 text-purple-700">
      You are viewing this workshop as an admin. Registration, payment,
      and session locks do not apply to this account.
    </p>

    <Link
      href="/admin/registrations"
      className="mt-5 inline-flex rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
    >
      Manage registrations
    </Link>
  </div>
) : !user ? (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
5. Build and push
cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Unlock workshop access for admin"
git push origin main
After this, admin accounts will never be locked on the workshop page. Student users still follow the normal flow: register → payment → confirmed access.



Add admin notice in the registration sidebar

send me the where and full code 

Thought for 7s
Use this file:

app/workshops/[slug]/page.tsx
You need to update 3 places.

1. Add admin role check
Find this part:

const {
  data: { user },
} = await supabase.auth.getUser();
Replace it with this full code:

const {
  data: { user },
} = await supabase.auth.getUser();

let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";
2. Update access logic
Find this:

const paidAccess = hasPaidAccess(registration);
const canSeeWorkshopCost = Boolean(registration);
Replace it with:

const paidAccess = isAdmin || hasPaidAccess(registration);
const canSeeWorkshopCost = isAdmin || Boolean(registration);
3. Replace the full registration sidebar block
In the same file, find this section:

<aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
Replace the whole <aside>...</aside> block with this:

<aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 className="text-2xl font-black text-slate-950">
    Register for this workshop
  </h2>

  {registered ? (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
      Registration submitted successfully. Check your message box for the next
      payment step.
    </div>
  ) : null}

  {message ? (
    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
      {message}
    </div>
  ) : null}

  {isAdmin ? (
    <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
      <p className="font-semibold text-purple-800">
        Admin access enabled.
      </p>

      <p className="mt-2 text-sm leading-6 text-purple-700">
        You are viewing this workshop as an admin. Registration, payment, cost,
        session links, materials, recordings, and videos are unlocked for this
        account.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/registrations"
          className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
        >
          Manage registrations
        </Link>

        <Link
          href="/admin/workshops"
          className="rounded-xl border border-purple-300 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100"
        >
          Manage workshops
        </Link>
      </div>
    </div>
  ) : !user ? (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-semibold text-amber-800">
        Please register as a website member first.
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-700">
        Guest users cannot see workshop cost or register directly. After you
        create an account and login, you can submit your workshop registration.
        Cost and payment details are shown only after registration.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/signup?redirect=/workshops/${slug}`}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
        >
          Create account
        </Link>

        <Link
          href={`/login?redirect=/workshops/${slug}`}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
        >
          Login
        </Link>
      </div>
    </div>
  ) : registration ? (
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="font-semibold text-blue-800">
        You have already registered for this workshop.
      </p>

      <p className="mt-2 text-sm text-blue-700">
        Registration status: {registration.status || "registered"}
      </p>

      <p className="mt-1 text-sm text-blue-700">
        Payment status: {registration.payment_status || "pending"}
      </p>

      <p className="mt-1 text-sm font-semibold text-blue-800">
        Workshop cost: {formatPrice(workshop)}
      </p>

      {registration.payment_link ? (
        <a
          href={registration.payment_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
        >
          Open payment link
        </a>
      ) : (
        <Link
          href="/dashboard/messages"
          className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
        >
          Check message box
        </Link>
      )}
    </div>
  ) : (
    <form action={registerForWorkshop} className="mt-6 space-y-4">
      <input type="hidden" name="workshop_id" value={workshop.id} />
      <input type="hidden" name="workshop_slug" value={slug} />

      <input
        name="full_name"
        required
        placeholder="Full name"
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        name="email"
        type="email"
        required
        defaultValue={user.email ?? ""}
        placeholder="Email address"
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        name="phone"
        placeholder="Phone / WhatsApp / WeChat"
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        name="organization"
        placeholder="University / company"
        className="w-full rounded-xl border px-4 py-3"
      />

      <textarea
        name="message"
        rows={4}
        placeholder="Message or questions"
        className="w-full rounded-xl border px-4 py-3"
      />

      <button
        type="submit"
        className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
      >
        Submit Registration
      </button>
    </form>
  )}

  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
    {workshop.instructor || workshop.speaker ? (
      <p>
        <strong>Instructor:</strong>{" "}
        {workshop.instructor || workshop.speaker}
      </p>
    ) : null}

    {workshop.location ? (
      <p className="mt-2">
        <strong>Location:</strong> {workshop.location}
      </p>
    ) : null}

    {paidAccess && materialUrl ? (
      <a
        href={materialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex font-bold text-blue-700 hover:underline"
      >
        View workshop material
      </a>
    ) : null}
  </div>
</aside>
Then run:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Unlock workshop sidebar for admin"
git push origin main

  Creating an optimized production build ...
✓ Compiled successfully in 4.7s
  Running TypeScript  ...Failed to type check.

./app/workshops/[slug]/page.tsx:91:39
Type error: Block-scoped variable 'supabase' used before its declaration.

  89 |
  90 | if (user) {
> 91 |   const { data: profileData } = await supabase
     |                                       ^
  92 |     .from("profiles")
  93 |     .select("role")
  94 |     .eq("id", user.id)
Next.js build worker exited with code: 1 and signal: null
[main 485162f] Unlock workshop sidebar for admin

Thought for 6s
Your supabase variable is being used before this line exists:

const supabase = await createClient();
Fix it by moving the admin role check after const supabase = await createClient();.

Open:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

code "app/workshops/[slug]/page.tsx"
Inside WorkshopDetailPage, find this part:

const { slug } = await params;
const { message, registered } = await searchParams;

const {
  data: { user },
} = await supabase.auth.getUser();

let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";

const supabase = await createClient();
Replace that whole part with this:

const { slug } = await params;
const { message, registered } = await searchParams;

const supabase = await createClient();

const {
  data: { user },
} = await supabase.auth.getUser();

let profile: { role?: string | null } | null = null;

if (user) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  profile = profileData;
}

const isAdmin = profile?.role === "admin";
The important order is:

const supabase = await createClient();
must come before:

await supabase.auth.getUser();
await supabase.from("profiles")
Then run:

npm run build
If it succeeds, because you already made a commit, do:

git add -A
git commit --amend --no-edit
git push origin main
If Git says you already pushed, use:

git add -A
git commit -m "Fix workshop admin access build error"
git push origin main

give me the full code of this part

Thought for a few seconds
In this file:

app/workshops/[slug]/page.tsx
inside this function:

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; registered?: string }>;
}) {
replace the top part of the function with this:

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; registered?: string }>;
}) {
  noStore();

  const { slug } = await params;
  const { message, registered } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role?: string | null } | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData;
  }

  const isAdmin = profile?.role === "admin";

  const { data: workshopData, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

  const published =
    workshop.is_published !== false && workshop.is_active !== false;

  if (!published) {
    notFound();
  }

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const sessions = (sessionsData ?? []) as WorkshopSession[];

  let registration: Registration | null = null;

  if (user) {
    const { data: registrationData } = await supabase
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationData as Registration | null;
  }

  const paidAccess = isAdmin || hasPaidAccess(registration);
  const canSeeWorkshopCost = isAdmin || Boolean(registration);

  const coverImage = getCoverImage(workshop);
  const materialUrl = getMaterialUrl(workshop);
  const description = getWorkshopDescription(workshop);
Important: after this block, your file should continue with:

  return (
    <main className="bg-slate-50">
The build error happened because supabase was used before this line:

const supabase = await createClient();


⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 4.2s
  Running TypeScript  ..Failed to type check.

./app/workshops/[slug]/page.tsx:91:39
Type error: Block-scoped variable 'supabase' used before its declaration.

  89 |
  90 | if (user) {
> 91 |   const { data: profileData } = await supabase
     |                                       ^
  92 |     .from("profiles")
  93 |     .select("role")
  94 |     .eq("id", user.id)
Next.js build worker exited with code: 1 and signal: null

Thought for 12s
The warning about middleware is not the problem. The real problem is still this:

supabase used before its declaration
It means your file still has this wrong order:

await supabase.auth.getUser();

const supabase = await createClient();
It must be:

const supabase = await createClient();

await supabase.auth.getUser();
Replace this part exactly
Open:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

code "app/workshops/[slug]/page.tsx"
Find this function:

export default async function WorkshopDetailPage({
From that line until this line:

const description = getWorkshopDescription(workshop);
replace the whole block with this:

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; registered?: string }>;
}) {
  noStore();

  const { slug } = await params;
  const { message, registered } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role?: string | null } | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData;
  }

  const isAdmin = profile?.role === "admin";

  const { data: workshopData, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

  const published =
    workshop.is_published !== false && workshop.is_active !== false;

  if (!published) {
    notFound();
  }

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const sessions = (sessionsData ?? []) as WorkshopSession[];

  let registration: Registration | null = null;

  if (user) {
    const { data: registrationData } = await supabase
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationData as Registration | null;
  }

  const paidAccess = isAdmin || hasPaidAccess(registration);
  const canSeeWorkshopCost = isAdmin || Boolean(registration);

  const coverImage = getCoverImage(workshop);
  const materialUrl = getMaterialUrl(workshop);
  const description = getWorkshopDescription(workshop);
After this block, your next line should still be:

  return (
Check there is no old wrong block left
Run this:

grep -n "supabase = await createClient\|auth.getUser\|profileData" "app/workshops/[slug]/page.tsx"
The order must look like this:

const supabase = await createClient();
await supabase.auth.getUser();
const { data: profileData } = await supabase
If profileData appears before const supabase = await createClient();, then the old wrong block is still there and must be deleted.

Then build:

npm run build
If it succeeds:

git add -A
git commit -m "Fix workshop page supabase declaration order"
git push origin main

just give me the full code of this

Thought for 9s
Replace the full file:

app/workshops/[slug]/page.tsx
with this:

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
  language?: string | null;
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  instructor?: string | null;
  speaker?: string | null;
  format?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  duration?: string | null;
  price?: number | null;
  currency?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  material_url?: string | null;
  materials_url?: string | null;
  resource_url?: string | null;
  file_url?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
};

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type Registration = {
  id: string;
  user_id?: string | null;
  workshop_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  created_at?: string | null;
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

async function registerForWorkshop(formData: FormData) {
  "use server";

  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const workshopId = field(formData, "workshop_id");
  const workshopSlug = field(formData, "workshop_slug");
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");

  if (!workshopId || !workshopSlug) {
    redirect("/workshops?message=Missing workshop information");
  }

  if (!user) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "Please register or login as a member first"
      )}`
    );
  }

  if (!fullName || !email) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "Name and email are required"
      )}`
    );
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(
        "You have already registered for this workshop"
      )}`
    );
  }

  const { error } = await supabase.from("workshop_registrations").insert({
    workshop_id: workshopId,
    workshop_slug: workshopSlug,
    session_id: null,
    user_id: user.id,
    full_name: fullName,
    email,
    phone: nullableField(formData, "phone"),
    organization: nullableField(formData, "organization"),
    message: nullableField(formData, "message"),
    status: "registered",
    payment_status: "pending",
    payment_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/workshops/${workshopSlug}?message=${encodeURIComponent(error.message)}`
    );
  }

  await supabase.from("user_messages").insert({
    user_id: user.id,
    title: "Workshop registration received",
    body:
      "Your workshop registration has been received. Our team will review it and send you the next payment step here. After payment is confirmed, the full workshop session links will be unlocked.",
    link_url: `/workshops/${workshopSlug}`,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  revalidatePath(`/workshops/${workshopSlug}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/registrations");
  revalidatePath("/manager/registrations");

  redirect(`/workshops/${workshopSlug}?registered=1`);
}

function getYouTubeEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        const videoId = parsedUrl.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return url;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsedUrl.pathname.replace("/", "").split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getCoverImage(workshop: Workshop) {
  return (
    workshop.image_url ||
    workshop.cover_url ||
    workshop.thumbnail_url ||
    null
  );
}

function getMaterialUrl(workshop: Workshop) {
  return (
    workshop.material_url ||
    workshop.materials_url ||
    workshop.resource_url ||
    workshop.file_url ||
    null
  );
}

function getWorkshopDescription(workshop: Workshop) {
  return (
    workshop.description ||
    workshop.short_description ||
    workshop.summary ||
    "Workshop details will be updated soon."
  );
}

function formatPrice(workshop: Workshop) {
  const price = Number(workshop.price ?? 0);

  if (!price) {
    return "Contact us";
  }

  return `${price} ${workshop.currency || "USD"}`;
}

function hasPaidAccess(registration: Registration | null) {
  if (!registration) return false;

  return (
    registration.payment_status === "confirmed" ||
    registration.payment_status === "paid" ||
    registration.status === "approved" ||
    registration.status === "confirmed" ||
    registration.status === "paid"
  );
}

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string; registered?: string }>;
}) {
  noStore();

  const { slug } = await params;
  const { message, registered } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role?: string | null } | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData;
  }

  const isAdmin = profile?.role === "admin";

  const { data: workshopData, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !workshopData) {
    notFound();
  }

  const workshop = workshopData as Workshop;

  const published =
    workshop.is_published !== false && workshop.is_active !== false;

  if (!published && !isAdmin) {
    notFound();
  }

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select("*")
    .eq("workshop_id", workshop.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const sessions = (sessionsData ?? []) as WorkshopSession[];

  let registration: Registration | null = null;

  if (user) {
    const { data: registrationData } = await supabase
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = registrationData as Registration | null;
  }

  const paidAccess = isAdmin || hasPaidAccess(registration);
  const canSeeWorkshopCost = isAdmin || Boolean(registration);

  const coverImage = getCoverImage(workshop);
  const materialUrl = getMaterialUrl(workshop);
  const description = getWorkshopDescription(workshop);

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/workshops"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to workshops
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {coverImage ? (
            <img
              src={coverImage}
              alt={workshop.title ?? "Workshop cover"}
              className="h-[360px] w-full object-cover"
            />
          ) : (
            <div className="h-[360px] w-full bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100" />
          )}

          <div className="p-8 md:p-10">
            <p className="text-sm font-semibold text-slate-500">
              {workshop.level || "Beginner"} · {workshop.language || "English"}
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              {workshop.title}
            </h1>

            {workshop.short_description || workshop.summary ? (
              <p className="mt-6 max-w-4xl text-xl leading-9 text-slate-600">
                {workshop.short_description || workshop.summary}
              </p>
            ) : null}

            <div
              className={
                canSeeWorkshopCost
                  ? "mt-8 grid gap-4 md:grid-cols-4"
                  : "mt-8 grid gap-4 md:grid-cols-3"
              }
            >
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Format
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.format || "Online"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.start_date || workshop.date || "TBA"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Duration
                </p>
                <p className="mt-2 font-bold text-slate-900">
                  {workshop.duration || "TBA"}
                </p>
              </div>

              {canSeeWorkshopCost ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Cost
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {formatPrice(workshop)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-black text-slate-950">
                Workshop introduction
              </h2>

              <div className="mt-6 whitespace-pre-wrap text-lg leading-9 text-slate-700">
                {description}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-black text-slate-950">
                Session arrangement
              </h2>

              {isAdmin ? (
                <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-800">
                  Admin preview mode. All workshop session links, materials,
                  recordings, and videos are unlocked for this account.
                </div>
              ) : !user ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  Please register or login as a member first. After registration
                  and payment confirmation, full session links will be unlocked.
                </div>
              ) : registration && !paidAccess ? (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
                  You have registered for this workshop. Please check your
                  message box for the payment step. Session links will be
                  unlocked after payment is confirmed.

                  <div className="mt-4">
                    <Link
                      href="/dashboard/messages"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Open message box
                    </Link>
                  </div>
                </div>
              ) : paidAccess ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                  Payment confirmed. Full session links are unlocked.
                </div>
              ) : null}

              {sessions.length === 0 ? (
                <p className="mt-6 text-lg text-slate-600">
                  No upcoming sessions yet.
                </p>
              ) : (
                <div className="mt-6 space-y-5">
                  {sessions.map((session) => {
                    const youtubeEmbedUrl = getYouTubeEmbedUrl(
                      session.media_url
                    );

                    return (
                      <article
                        key={session.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >
                        <h3 className="text-xl font-black text-slate-950">
                          {session.title || "Workshop Session"}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                          {session.session_date ? (
                            <span>Date: {session.session_date}</span>
                          ) : null}

                          {session.start_time ? (
                            <span>Start: {session.start_time}</span>
                          ) : null}

                          {session.end_time ? (
                            <span>End: {session.end_time}</span>
                          ) : null}

                          {session.location ? (
                            <span>Location: {session.location}</span>
                          ) : null}
                        </div>

                        {paidAccess && session.media_url ? (
                          <div className="mt-5 overflow-hidden rounded-2xl bg-slate-950">
                            {session.media_type === "video" ? (
                              <video
                                src={session.media_url}
                                controls
                                playsInline
                                className="aspect-video w-full object-cover"
                              />
                            ) : youtubeEmbedUrl ? (
                              <iframe
                                src={youtubeEmbedUrl}
                                title={session.title || "Workshop video"}
                                className="aspect-video w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            ) : (
                              <div className="flex aspect-video items-center justify-center p-6 text-center text-white">
                                <a
                                  href={session.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100"
                                >
                                  Open session video
                                </a>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {paidAccess ? (
                          <div className="mt-5 flex flex-wrap gap-3">
                            {session.meeting_url ? (
                              <a
                                href={session.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                              >
                                Join session
                              </a>
                            ) : null}

                            {session.recording_url ? (
                              <a
                                href={session.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                              >
                                Recording
                              </a>
                            ) : null}

                            {session.material_url ? (
                              <a
                                href={session.material_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                              >
                                Materials
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                            Session links are locked until registration and
                            payment confirmation.
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Register for this workshop
            </h2>

            {registered ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Registration submitted successfully. Check your message box for
                the next payment step.
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {message}
              </div>
            ) : null}

            {isAdmin ? (
              <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <p className="font-semibold text-purple-800">
                  Admin access enabled.
                </p>

                <p className="mt-2 text-sm leading-6 text-purple-700">
                  You are viewing this workshop as an admin. Registration,
                  payment, cost, session links, materials, recordings, and
                  videos are unlocked for this account.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin/registrations"
                    className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white hover:bg-purple-800"
                  >
                    Manage registrations
                  </Link>

                  <Link
                    href="/admin/workshops"
                    className="rounded-xl border border-purple-300 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100"
                  >
                    Manage workshops
                  </Link>
                </div>
              </div>
            ) : !user ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-800">
                  Please register as a website member first.
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Guest users cannot see workshop cost or register directly.
                  After you create an account and login, you can submit your
                  workshop registration. Cost and payment details are shown only
                  after registration.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/signup?redirect=/workshops/${slug}`}
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    Create account
                  </Link>

                  <Link
                    href={`/login?redirect=/workshops/${slug}`}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                  >
                    Login
                  </Link>
                </div>
              </div>
            ) : registration ? (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-semibold text-blue-800">
                  You have already registered for this workshop.
                </p>

                <p className="mt-2 text-sm text-blue-700">
                  Registration status: {registration.status || "registered"}
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Payment status: {registration.payment_status || "pending"}
                </p>

                <p className="mt-1 text-sm font-semibold text-blue-800">
                  Workshop cost: {formatPrice(workshop)}
                </p>

                {registration.payment_link ? (
                  <a
                    href={registration.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    Open payment link
                  </a>
                ) : (
                  <Link
                    href="/dashboard/messages"
                    className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    Check message box
                  </Link>
                )}
              </div>
            ) : (
              <form action={registerForWorkshop} className="mt-6 space-y-4">
                <input type="hidden" name="workshop_id" value={workshop.id} />
                <input type="hidden" name="workshop_slug" value={slug} />

                <input
                  name="full_name"
                  required
                  placeholder="Full name"
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email ?? ""}
                  placeholder="Email address"
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="phone"
                  placeholder="Phone / WhatsApp / WeChat"
                  className="w-full rounded-xl border px-4 py-3"
                />

                <input
                  name="organization"
                  placeholder="University / company"
                  className="w-full rounded-xl border px-4 py-3"
                />

                <textarea
                  name="message"
                  rows={4}
                  placeholder="Message or questions"
                  className="w-full rounded-xl border px-4 py-3"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700"
                >
                  Submit Registration
                </button>
              </form>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {workshop.instructor || workshop.speaker ? (
                <p>
                  <strong>Instructor:</strong>{" "}
                  {workshop.instructor || workshop.speaker}
                </p>
              ) : null}

              {workshop.location ? (
                <p className="mt-2">
                  <strong>Location:</strong> {workshop.location}
                </p>
              ) : null}

              {paidAccess && materialUrl ? (
                <a
                  href={materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex font-bold text-blue-700 hover:underline"
                >
                  View workshop material
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
Then run:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Fix full workshop page admin unlock"
git push origin main

i can only add sessions but not remove sessions, and i cannot add subsessions of each major session, solve this 

Thought for 29s
You need one new table for subsessions, plus 3 new actions:

deleteWorkshopSession
createWorkshopSubsession
deleteWorkshopSubsession
Then update the admin workshop page to show existing sessions, delete sessions, and add/delete subsessions.

1. Run this SQL in Supabase
create extension if not exists pgcrypto;

create table if not exists public.workshop_subsessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.workshop_sessions(id) on delete cascade,
  title text not null default 'Subsession',
  description text,
  start_time text,
  end_time text,
  meeting_url text,
  recording_url text,
  material_url text,
  media_type text default 'none',
  media_url text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workshop_subsessions add column if not exists session_id uuid references public.workshop_sessions(id) on delete cascade;
alter table public.workshop_subsessions add column if not exists title text default 'Subsession';
alter table public.workshop_subsessions add column if not exists description text;
alter table public.workshop_subsessions add column if not exists start_time text;
alter table public.workshop_subsessions add column if not exists end_time text;
alter table public.workshop_subsessions add column if not exists meeting_url text;
alter table public.workshop_subsessions add column if not exists recording_url text;
alter table public.workshop_subsessions add column if not exists material_url text;
alter table public.workshop_subsessions add column if not exists media_type text default 'none';
alter table public.workshop_subsessions add column if not exists media_url text;
alter table public.workshop_subsessions add column if not exists display_order integer default 0;
alter table public.workshop_subsessions add column if not exists is_active boolean default true;
alter table public.workshop_subsessions add column if not exists created_at timestamptz default now();
alter table public.workshop_subsessions add column if not exists updated_at timestamptz default now();

alter table public.workshop_subsessions enable row level security;

drop policy if exists "Public can view active workshop subsessions" on public.workshop_subsessions;

create policy "Public can view active workshop subsessions"
on public.workshop_subsessions
for select
using (is_active = true);

notify pgrst, 'reload schema';
2. Replace full app/admin/workshops/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableField(formData: FormData, key: string) {
  const value = field(formData, key);
  return value.length > 0 ? value : null;
}

function numberField(formData: FormData, key: string, fallback = 0) {
  const value = field(formData, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checkboxField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getWorkshopPayload(formData: FormData) {
  const title = field(formData, "title");
  const slug = field(formData, "slug") || slugify(title);

  const shortDescription =
    nullableField(formData, "short_description") ||
    nullableField(formData, "summary");

  const description = nullableField(formData, "description");

  const instructor =
    nullableField(formData, "instructor") ||
    nullableField(formData, "speaker");

  const startDate =
    nullableField(formData, "start_date") || nullableField(formData, "date");

  const imageUrl =
    nullableField(formData, "image_url") ||
    nullableField(formData, "cover_url") ||
    nullableField(formData, "thumbnail_url");

  const materialUrl =
    nullableField(formData, "material_url") ||
    nullableField(formData, "materials_url") ||
    nullableField(formData, "resource_url") ||
    nullableField(formData, "file_url");

  const isPublished =
    checkboxField(formData, "is_published") ||
    checkboxField(formData, "is_active");

  return {
    title,
    slug,

    level: field(formData, "level") || "Beginner",
    language: field(formData, "language") || "English",

    short_description: shortDescription,
    summary: shortDescription,

    description,

    instructor,
    speaker: instructor,

    location: nullableField(formData, "location"),
    format: field(formData, "format") || "Online",

    start_date: startDate,
    date: startDate,
    end_date: nullableField(formData, "end_date"),
    duration: nullableField(formData, "duration"),

    price: numberField(formData, "price", 0),
    currency: field(formData, "currency") || "USD",
    capacity: numberField(formData, "capacity", 0),

    image_url: imageUrl,
    cover_url: imageUrl,
    thumbnail_url: imageUrl,

    material_url: materialUrl,
    materials_url: materialUrl,
    resource_url: materialUrl,
    file_url: materialUrl,

    is_featured: checkboxField(formData, "is_featured"),
    is_published: isPublished,
    is_active: isPublished,

    updated_at: new Date().toISOString(),
  };
}

export async function createWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const title = field(formData, "title");

  if (!title) {
    redirect("/admin/workshops?message=Workshop title is required");
  }

  const payload = getWorkshopPayload(formData);

  const { error } = await supabase.from("workshops").insert({
    ...payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath(`/workshops/${payload.slug}`);
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Workshop created");
}

export async function updateWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");
  const title = field(formData, "title");

  if (!id || !title) {
    redirect("/admin/workshops?message=Missing workshop ID or title");
  }

  const payload = getWorkshopPayload(formData);

  const { error } = await supabase
    .from("workshops")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/workshops/${id}/edit?message=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath(`/workshops/${payload.slug}`);
  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${id}/edit`);

  redirect(`/admin/workshops/${id}/edit?message=Workshop updated`);
}

export async function deleteWorkshop(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/workshops?message=Missing workshop ID");
  }

  const { error } = await supabase.from("workshops").delete().eq("id", id);

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Workshop deleted");
}

export async function createWorkshopSession(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const workshopId = field(formData, "workshop_id");

  const title =
    field(formData, "title") ||
    field(formData, "session_title") ||
    "Workshop Session";

  if (!workshopId) {
    redirect("/admin/workshops?message=Missing workshop ID");
  }

  const sessionDate =
    nullableField(formData, "session_date") || nullableField(formData, "date");

  const startTime = nullableField(formData, "start_time");
  const endTime = nullableField(formData, "end_time");

  const startsAt =
    sessionDate && startTime
      ? new Date(`${sessionDate}T${startTime}:00`).toISOString()
      : sessionDate
        ? new Date(`${sessionDate}T09:00:00`).toISOString()
        : new Date().toISOString();

  const endsAt =
    sessionDate && endTime
      ? new Date(`${sessionDate}T${endTime}:00`).toISOString()
      : null;

  const externalVideoUrl = nullableField(formData, "external_video_url");
  const uploadedSessionMediaUrl = nullableField(formData, "session_media_url");
  const uploadedSessionMediaType = field(formData, "session_media_type");

  const finalMediaType = externalVideoUrl
    ? "external_video"
    : uploadedSessionMediaType || "none";

  const finalMediaUrl = externalVideoUrl || uploadedSessionMediaUrl;

  const { error } = await supabase.from("workshop_sessions").insert({
    workshop_id: workshopId,

    title,

    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,

    starts_at: startsAt,
    ends_at: endsAt,

    location: nullableField(formData, "location"),

    meeting_url:
      nullableField(formData, "meeting_url") ||
      nullableField(formData, "zoom_url"),

    recording_url: nullableField(formData, "recording_url"),

    material_url:
      nullableField(formData, "material_url") ||
      nullableField(formData, "materials_url") ||
      nullableField(formData, "resource_url") ||
      nullableField(formData, "file_url"),

    media_type: finalMediaType,
    media_url: finalMediaUrl,

    display_order: numberField(formData, "display_order", 0),

    is_active:
      formData.has("is_active") || formData.has("is_published")
        ? checkboxField(formData, "is_active") ||
          checkboxField(formData, "is_published")
        : true,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Workshop session created");
}

export async function deleteWorkshopSession(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/workshops?message=Missing session ID");
  }

  const { error } = await supabase.from("workshop_sessions").delete().eq("id", id);

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Session deleted");
}

export async function createWorkshopSubsession(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const sessionId = field(formData, "session_id");

  if (!sessionId) {
    redirect("/admin/workshops?message=Missing major session ID");
  }

  const title = field(formData, "title") || "Subsession";

  const externalVideoUrl = nullableField(formData, "external_video_url");
  const uploadedSessionMediaUrl = nullableField(formData, "session_media_url");
  const uploadedSessionMediaType = field(formData, "session_media_type");

  const finalMediaType = externalVideoUrl
    ? "external_video"
    : uploadedSessionMediaType || "none";

  const finalMediaUrl = externalVideoUrl || uploadedSessionMediaUrl;

  const { error } = await supabase.from("workshop_subsessions").insert({
    session_id: sessionId,
    title,
    description: nullableField(formData, "description"),
    start_time: nullableField(formData, "start_time"),
    end_time: nullableField(formData, "end_time"),

    meeting_url:
      nullableField(formData, "meeting_url") ||
      nullableField(formData, "zoom_url"),

    recording_url: nullableField(formData, "recording_url"),

    material_url:
      nullableField(formData, "material_url") ||
      nullableField(formData, "materials_url") ||
      nullableField(formData, "resource_url") ||
      nullableField(formData, "file_url"),

    media_type: finalMediaType,
    media_url: finalMediaUrl,

    display_order: numberField(formData, "display_order", 0),

    is_active:
      formData.has("is_active") || formData.has("is_published")
        ? checkboxField(formData, "is_active") ||
          checkboxField(formData, "is_published")
        : true,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Subsession created");
}

export async function deleteWorkshopSubsession(formData: FormData) {
  await requireAdmin();

  const supabase = createAdminClient();

  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/workshops?message=Missing subsession ID");
  }

  const { error } = await supabase
    .from("workshop_subsessions")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/admin/workshops?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/workshops");
  revalidatePath("/admin/workshops");

  redirect("/admin/workshops?message=Subsession deleted");
}
3. Replace full app/admin/workshops/page.tsx
This gives you:

Add session
Delete session
Add subsession under each session
Delete subsession
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createWorkshop,
  createWorkshopSession,
  createWorkshopSubsession,
  deleteWorkshopSession,
  deleteWorkshopSubsession,
} from "./actions";
import SessionMediaUploader from "@/components/SessionMediaUploader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title?: string | null;
  slug?: string | null;
  level?: string | null;
  language?: string | null;
  short_description?: string | null;
  summary?: string | null;
  format?: string | null;
  start_date?: string | null;
  date?: string | null;
  duration?: string | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type WorkshopSession = {
  id: string;
  workshop_id?: string | null;
  title?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  starts_at?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type WorkshopSubsession = {
  id: string;
  session_id?: string | null;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_url?: string | null;
  recording_url?: string | null;
  material_url?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  noStore();
  await requireAdmin();

  const { message } = await searchParams;

  const supabase = createAdminClient();

  const { data: workshopsData, error: workshopsError } = await supabase
    .from("workshops")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("workshop_sessions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true });

  const { data: subsessionsData, error: subsessionsError } = await supabase
    .from("workshop_subsessions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const workshops = (workshopsData ?? []) as Workshop[];
  const sessions = (sessionsData ?? []) as WorkshopSession[];
  const subsessions = (subsessionsData ?? []) as WorkshopSubsession[];

  const workshopById = new Map(
    workshops.map((workshop) => [workshop.id, workshop])
  );

  const subsessionsBySessionId = new Map<string, WorkshopSubsession[]>();

  for (const subsession of subsessions) {
    if (!subsession.session_id) continue;

    const existing = subsessionsBySessionId.get(subsession.session_id) ?? [];
    existing.push(subsession);
    subsessionsBySessionId.set(subsession.session_id, existing);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Link
          href="/admin"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to admin dashboard
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Workshop Management
        </h1>

        <p className="mt-4 max-w-3xl text-slate-600">
          Create workshops, add major sessions, delete sessions, and add
          subsessions under each major session.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {workshopsError || sessionsError || subsessionsError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {workshopsError?.message ||
            sessionsError?.message ||
            subsessionsError?.message}
        </div>
      ) : null}

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Add New Workshop
        </h2>

        <form action={createWorkshop} className="mt-6 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              required
              placeholder="Workshop title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="slug"
              placeholder="workshop-slug"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <select
              name="level"
              defaultValue="Beginner"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>

            <input
              name="language"
              defaultValue="English"
              className="w-full rounded-xl border px-4 py-3"
            />

            <select
              name="format"
              defaultValue="Online"
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <textarea
            name="short_description"
            rows={3}
            placeholder="Short description"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="description"
            rows={8}
            placeholder="Full workshop introduction"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="instructor"
              placeholder="Instructor / Speaker"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="location"
              placeholder="Location"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="start_date"
              type="date"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="end_date"
              type="date"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="duration"
              placeholder="Duration"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={0}
              placeholder="Price"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="currency"
              defaultValue="USD"
              placeholder="Currency"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="capacity"
              type="number"
              defaultValue={0}
              placeholder="Capacity"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="image_url"
            placeholder="Cover image URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="material_url"
            placeholder="Workshop material URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="flex flex-wrap gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex items-center gap-2">
              <input name="is_featured" type="checkbox" />
              <span>Feature this workshop</span>
            </label>

            <label className="flex items-center gap-2">
              <input name="is_published" type="checkbox" defaultChecked />
              <span>Publish this workshop</span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-fit">
            Create Workshop
          </button>
        </form>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Add Major Session
        </h2>

        <form action={createWorkshopSession} className="mt-6 grid gap-5">
          <select
            name="workshop_id"
            required
            className="w-full rounded-xl border px-4 py-3"
          >
            <option value="">Choose workshop</option>
            {workshops.map((workshop) => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.title}
              </option>
            ))}
          </select>

          <div className="grid gap-5 md:grid-cols-2">
            <input
              name="title"
              placeholder="Major session title"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="session_date"
              type="date"
              required
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <input
              name="start_time"
              type="time"
              required
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="end_time"
              type="time"
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              name="display_order"
              type="number"
              defaultValue={0}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <input
            name="location"
            placeholder="Session location"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="meeting_url"
            placeholder="Meeting / Zoom URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="recording_url"
            placeholder="Recording URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="material_url"
            placeholder="Session material URL"
            className="w-full rounded-xl border px-4 py-3"
          />

          <SessionMediaUploader />

          <input
            name="external_video_url"
            placeholder="YouTube / Jianying / external video link"
            className="w-full rounded-xl border px-4 py-3"
          />

          <label className="flex items-center gap-2">
            <input name="is_active" type="checkbox" defaultChecked />
            <span>Show this session</span>
          </label>

          <button type="submit" className="btn-primary w-fit">
            Add Major Session
          </button>
        </form>
      </section>

      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Existing Sessions and Subsessions
        </h2>

        {sessions.length === 0 ? (
          <p className="mt-4 text-slate-600">No sessions yet.</p>
        ) : (
          <div className="mt-6 grid gap-6">
            {sessions.map((session) => {
              const workshop = session.workshop_id
                ? workshopById.get(session.workshop_id)
                : null;

              const childSubsessions =
                subsessionsBySessionId.get(session.id) ?? [];

              return (
                <article
                  key={session.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        {workshop?.title || "Unknown workshop"}
                      </p>

                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {session.title || "Major Session"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {session.session_date || "No date"} ·{" "}
                        {session.start_time || "No start time"}-
                        {session.end_time || "No end time"} · Order{" "}
                        {session.display_order ?? 0}
                      </p>
                    </div>

                    <form action={deleteWorkshopSession}>
                      <input type="hidden" name="id" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Delete major session
                      </button>
                    </form>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <h4 className="text-lg font-black text-slate-950">
                      Add Subsession under this major session
                    </h4>

                    <form
                      action={createWorkshopSubsession}
                      className="mt-4 grid gap-4"
                    >
                      <input
                        type="hidden"
                        name="session_id"
                        value={session.id}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          name="title"
                          placeholder="Subsession title"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                        <input
                          name="display_order"
                          type="number"
                          defaultValue={0}
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </div>

                      <textarea
                        name="description"
                        rows={3}
                        placeholder="Subsession description"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          name="start_time"
                          type="time"
                          className="w-full rounded-xl border px-4 py-3"
                        />

                        <input
                          name="end_time"
                          type="time"
                          className="w-full rounded-xl border px-4 py-3"
                        />
                      </div>

                      <input
                        name="meeting_url"
                        placeholder="Subsession meeting URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <input
                        name="recording_url"
                        placeholder="Subsession recording URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <input
                        name="material_url"
                        placeholder="Subsession material URL"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <SessionMediaUploader />

                      <input
                        name="external_video_url"
                        placeholder="Subsession YouTube / Jianying / external video link"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <label className="flex items-center gap-2">
                        <input name="is_active" type="checkbox" defaultChecked />
                        <span>Show this subsession</span>
                      </label>

                      <button type="submit" className="btn-primary w-fit">
                        Add Subsession
                      </button>
                    </form>
                  </div>

                  {childSubsessions.length > 0 ? (
                    <div className="mt-6 grid gap-3">
                      <h4 className="font-black text-slate-950">
                        Existing Subsessions
                      </h4>

                      {childSubsessions.map((subsession) => (
                        <div
                          key={subsession.id}
                          className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-950">
                              {subsession.title}
                            </p>

                            <p className="text-sm text-slate-600">
                              {subsession.start_time || "No start time"}-
                              {subsession.end_time || "No end time"} · Order{" "}
                              {subsession.display_order ?? 0}
                            </p>

                            {subsession.description ? (
                              <p className="mt-1 text-sm text-slate-500">
                                {subsession.description}
                              </p>
                            ) : null}
                          </div>

                          <form action={deleteWorkshopSubsession}>
                            <input
                              type="hidden"
                              name="id"
                              value={subsession.id}
                            />
                            <button
                              type="submit"
                              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              Delete subsession
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Existing Workshops
        </h2>

        {workshops.length === 0 ? (
          <p className="mt-4 text-slate-600">No workshops yet.</p>
        ) : (
          <div className="mt-6 grid gap-5">
            {workshops.map((workshop) => {
              const publicHref = workshop.slug
                ? `/workshops/${workshop.slug}`
                : "/workshops";

              return (
                <article
                  key={workshop.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        {workshop.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {workshop.level || "Beginner"} ·{" "}
                        {workshop.format || "Online"} ·{" "}
                        {workshop.start_date || workshop.date || "TBA"}
                      </p>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {workshop.short_description ||
                          workshop.summary ||
                          "No short description."}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Status:{" "}
                        {workshop.is_published !== false &&
                        workshop.is_active !== false
                          ? "Published"
                          : "Hidden"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={publicHref}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/workshops/${workshop.id}/edit`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/admin/workshops/${workshop.id}/delete`}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
Then build:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Add delete sessions and workshop subsessions"
git push origin main

Please register as a website member first.

Guest users cannot see workshop cost or register directly. After you create an account and login, you can submit your workshop registration. Cost and payment details are shown only after registration. pls don't mention costs here cuz speakers sometimes don't need to know about this is paid

Thought for 5s
In this file:

app/workshops/[slug]/page.tsx
Find this text:

<p className="mt-2 text-sm leading-6 text-amber-700">
  Guest users cannot see workshop cost or register directly.
  After you create an account and login, you can submit your
  workshop registration. Cost and payment details are shown only
  after registration.
</p>
Replace it with this:

<p className="mt-2 text-sm leading-6 text-amber-700">
  Guest users cannot register directly for workshops. After you create an
  account and login, you can submit your workshop registration and receive the
  next steps from the LexData team.
</p>
So the full guest block should look like this:

<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
  <p className="font-semibold text-amber-800">
    Please register as a website member first.
  </p>

  <p className="mt-2 text-sm leading-6 text-amber-700">
    Guest users cannot register directly for workshops. After you create an
    account and login, you can submit your workshop registration and receive the
    next steps from the LexData team.
  </p>

  <div className="mt-5 flex flex-wrap gap-3">
    <Link
      href={`/signup?redirect=/workshops/${slug}`}
      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
    >
      Create account
    </Link>

    <Link
      href={`/login?redirect=/workshops/${slug}`}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
    >
      Login
    </Link>
  </div>
</div>
Then run:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Update guest workshop registration message"
git push origin main

so how can i control speakers don't know about the costs

Thought for 9s
Yes. The clean rule should be:

Admin / Manager: can see cost and payment information
Student: can see cost only after registration
Speaker: never sees cost or payment information
Guest: never sees cost or payment information
Update this file:

app/workshops/[slug]/page.tsx
1. Replace the role check
Find this:

const isAdmin = profile?.role === "admin";
Replace it with:

const role = profile?.role ?? null;

const isAdmin = role === "admin";
const isManager = role === "manager";
const isSpeaker = role === "speaker";

const canManageCosts = isAdmin || isManager;
2. Replace the access logic
Find this:

const paidAccess = isAdmin || hasPaidAccess(registration);
const canSeeWorkshopCost = isAdmin || Boolean(registration);
Replace it with:

const paidAccess = isAdmin || isManager || isSpeaker || hasPaidAccess(registration);

const canSeeWorkshopCost =
  canManageCosts || (Boolean(registration) && !isSpeaker);
This means:

Admin: sees cost
Manager: sees cost
Student after registration: sees cost
Speaker: does not see cost
Guest: does not see cost
3. Hide the “Workshop cost” line from speakers
Find this inside the registration sidebar:

<p className="mt-1 text-sm font-semibold text-blue-800">
  Workshop cost: {formatPrice(workshop)}
</p>
Replace it with:

{canSeeWorkshopCost ? (
  <p className="mt-1 text-sm font-semibold text-blue-800">
    Workshop cost: {formatPrice(workshop)}
  </p>
) : null}
4. Hide payment link from speakers
Find this:

{registration.payment_link ? (
  <a
    href={registration.payment_link}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
  >
    Open payment link
  </a>
) : (
  <Link
    href="/dashboard/messages"
    className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
  >
    Check message box
  </Link>
)}
Replace it with:

{!isSpeaker ? (
  registration.payment_link ? (
    <a
      href={registration.payment_link}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
    >
      Open payment link
    </a>
  ) : (
    <Link
      href="/dashboard/messages"
      className="mt-4 inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
    >
      Check message box
    </Link>
  )
) : null}
5. Optional: give speakers their own notice
In the session arrangement section, find this:

{isAdmin ? (
Replace it with:

{isAdmin || isManager ? (
Then add this block right after the admin/manager block:

) : isSpeaker ? (
  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
    Speaker preview mode. Session arrangements, materials, and links are
    available for this speaker account. Payment and cost information is hidden.
  </div>
So the logic becomes:

{isAdmin || isManager ? (
  <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-800">
    Admin preview mode. All workshop session links, materials, recordings, and
    videos are unlocked for this account.
  </div>
) : isSpeaker ? (
  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
    Speaker preview mode. Session arrangements, materials, and links are
    available for this speaker account. Payment and cost information is hidden.
  </div>
) : !user ? (
6. Build and push
cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

npm run build
git add -A
git commit -m "Hide workshop costs from speakers"
git push origin main
After this, speakers can access the workshop/session information, but they will not see cost, payment link, or payment-related wording.


add a button for dashboard /admin for admin and overall dashboard for other types of users; the media is not shown in the homepage either

Thought for 39s
Do these two updates.

1. Add dashboard/admin button on workshop page
Open:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

code "app/workshops/[slug]/page.tsx"
Find this line inside the sidebar:

<h2 className="text-2xl font-black text-slate-950">
  Register for this workshop
</h2>
Immediately under it, add this:

{user ? (
  <div className="mt-5">
    <Link
      href={isAdmin ? "/admin" : "/dashboard"}
      className="inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
    >
      {isAdmin ? "Go to Admin Dashboard" : "Go to Dashboard"}
    </Link>
  </div>
) : null}
So that section should become:

<aside className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 className="text-2xl font-black text-slate-950">
    Register for this workshop
  </h2>

  {user ? (
    <div className="mt-5">
      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        className="inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
      >
        {isAdmin ? "Go to Admin Dashboard" : "Go to Dashboard"}
      </Link>
    </div>
  ) : null}

  ...
</aside>
Only admin goes to:

/admin
Students, speakers, and managers go to:

/dashboard
2. Fix homepage media not showing
Replace this file fully:

code components/LatestWorkshopVideos.tsx
with this:

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionMediaRow = {
  id: string;
  title?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  session_date?: string | null;
  start_time?: string | null;
  created_at?: string | null;
  workshops?: {
    title?: string | null;
    slug?: string | null;
  } | null;
};

type SubsessionMediaRow = {
  id: string;
  title?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  start_time?: string | null;
  created_at?: string | null;
  workshop_sessions?: {
    title?: string | null;
    session_date?: string | null;
    workshops?: {
      title?: string | null;
      slug?: string | null;
    } | null;
  } | null;
};

type MediaItem = {
  id: string;
  title: string;
  parentTitle?: string | null;
  workshopTitle?: string | null;
  workshopSlug?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  dateText?: string | null;
  createdAt?: string | null;
  sourceType: "session" | "subsession";
};

function getYouTubeVideoId(url?: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || null;
      }
    }

    if (host === "youtu.be") {
      return parsedUrl.pathname.replace("/", "").split("?")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url?: string | null) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1`;
}

function isDirectVideo(url?: string | null) {
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".mp4") ||
    lowered.includes(".webm") ||
    lowered.includes(".mov") ||
    lowered.includes(".m4v")
  );
}

function isImage(url?: string | null, mediaType?: string | null) {
  if (mediaType === "image") return true;
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".jpg") ||
    lowered.includes(".jpeg") ||
    lowered.includes(".png") ||
    lowered.includes(".webp") ||
    lowered.includes(".gif")
  );
}

function getWorkshopHref(slug?: string | null) {
  return slug ? `/workshops/${slug}` : "/workshops";
}

function MediaPreview({ item }: { item: MediaItem }) {
  const mediaUrl = item.mediaUrl;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  if (!mediaUrl) {
    return (
      <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
        No media
      </div>
    );
  }

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={item.title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (item.mediaType === "video" || isDirectVideo(mediaUrl)) {
    return (
      <video
        src={mediaUrl}
        controls
        playsInline
        className="aspect-video w-full object-cover"
      />
    );
  }

  if (isImage(mediaUrl, item.mediaType)) {
    return (
      <img
        src={mediaUrl}
        alt={item.title}
        className="aspect-video w-full object-cover"
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-slate-950 p-6 text-center">
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
      >
        Open media
      </a>
    </div>
  );
}

export default async function LatestWorkshopVideos() {
  noStore();

  const supabase = createAdminClient();

  const { data: sessionRows, error: sessionError } = await supabase
    .from("workshop_sessions")
    .select(
      `
      id,
      title,
      media_type,
      media_url,
      session_date,
      start_time,
      created_at,
      workshops:workshop_id (
        title,
        slug
      )
    `
    )
    .eq("is_active", true)
    .not("media_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: subsessionRows, error: subsessionError } = await supabase
    .from("workshop_subsessions")
    .select(
      `
      id,
      title,
      media_type,
      media_url,
      start_time,
      created_at,
      workshop_sessions:session_id (
        title,
        session_date,
        workshops:workshop_id (
          title,
          slug
        )
      )
    `
    )
    .eq("is_active", true)
    .not("media_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);

  if (sessionError) {
    console.error("LatestWorkshopVideos session error:", sessionError.message);
  }

  if (subsessionError) {
    console.error(
      "LatestWorkshopVideos subsession error:",
      subsessionError.message
    );
  }

  const sessionItems: MediaItem[] = ((sessionRows ?? []) as SessionMediaRow[])
    .filter((item) => Boolean(item.media_url))
    .map((item) => ({
      id: `session-${item.id}`,
      title: item.title || "Workshop session",
      workshopTitle: item.workshops?.title || "Workshop",
      workshopSlug: item.workshops?.slug || null,
      mediaType: item.media_type || "none",
      mediaUrl: item.media_url || null,
      dateText: item.session_date || item.start_time || null,
      createdAt: item.created_at || null,
      sourceType: "session",
    }));

  const subsessionItems: MediaItem[] = (
    (subsessionRows ?? []) as SubsessionMediaRow[]
  )
    .filter((item) => Boolean(item.media_url))
    .map((item) => ({
      id: `subsession-${item.id}`,
      title: item.title || "Workshop subsession",
      parentTitle: item.workshop_sessions?.title || null,
      workshopTitle: item.workshop_sessions?.workshops?.title || "Workshop",
      workshopSlug: item.workshop_sessions?.workshops?.slug || null,
      mediaType: item.media_type || "none",
      mediaUrl: item.media_url || null,
      dateText:
        item.workshop_sessions?.session_date || item.start_time || null,
      createdAt: item.created_at || null,
      sourceType: "subsession",
    }));

  const items = [...sessionItems, ...subsessionItems]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return bTime - aTime;
    })
    .slice(0, 6);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              Workshop Media
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Latest workshop media
            </h2>

            <p className="mt-5 max-w-2xl text-slate-300">
              Watch public preview media from LexData workshop sessions and
              subsessions.
            </p>
          </div>

          <Link
            href="/workshops"
            className="w-fit rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Explore workshops
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl"
            >
              <div className="bg-slate-900">
                <MediaPreview item={item} />
              </div>

              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  {item.sourceType === "subsession"
                    ? "Subsession"
                    : "Session"}
                </p>

                <h3 className="mt-3 text-xl font-black text-white">
                  {item.title}
                </h3>

                {item.parentTitle ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Under: {item.parentTitle}
                  </p>
                ) : null}

                <p className="mt-2 text-sm text-slate-300">
                  {item.workshopTitle || "Workshop"}
                </p>

                {item.dateText ? (
                  <p className="mt-2 text-sm text-slate-400">
                    {item.dateText}
                  </p>
                ) : null}

                <Link
                  href={getWorkshopHref(item.workshopSlug)}
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
                >
                  Open workshop
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
3. Make sure homepage calls the media section
Open:

code app/page.tsx
Make sure you have this import:

import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
And make sure this appears after hero/video spotlight:

<LatestWorkshopVideos />
Example:

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <HomeVideoSpotlight />

      <LatestWorkshopVideos />

      {/* rest of homepage */}
    </>
  );
}
4. Build and push
npm run build
git add -A
git commit -m "Add dashboard button and fix homepage workshop media"
git push origin main
Important: homepage media will only show if the session or subsession has media_url. It will not show meeting_url, material_url, or recording_url on the public homepage. That avoids leaking paid/private workshop links.


i mean on homepage, so users can enter control panel personal page without entering /admin or /dashboard in the wbsite

Thought for 10s
Yes, this should be on the homepage, not only inside workshop pages.

Create one homepage component that automatically shows:

Admin user → Admin Dashboard button
Student / speaker / manager / normal user → Dashboard button
Guest user → Login / Create account buttons
1. Create this component
Create:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

code components/HomeControlPanelButton.tsx
Paste this full code:

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export default async function HomeControlPanelButton() {
  noStore();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name?: string | null; role?: string | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email;

  if (!user) {
    return (
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                  Member Access
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Login to access your personal dashboard
                </h2>

                <p className="mt-2 max-w-2xl text-slate-600">
                  Members can view workshop registrations, messages, payment
                  steps, and unlocked learning materials from their dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
                Control Panel
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {displayName ? `Welcome back, ${displayName}` : "Welcome back"}
              </h2>

              <p className="mt-2 max-w-2xl text-slate-300">
                {isAdmin
                  ? "Open your admin dashboard to manage workshops, registrations, homepage media, users, and website content."
                  : "Open your dashboard to view your learning, messages, registrations, and workshop access."}
              </p>
            </div>

            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="w-fit rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              {isAdmin ? "Open Admin Dashboard" : "Open My Dashboard"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
2. Add it to homepage
Open:

code app/page.tsx
Add this import at the top:

import HomeControlPanelButton from "@/components/HomeControlPanelButton";
Then put this right after <HomeHero />:

<HomeControlPanelButton />
So the top of your homepage should look like this:

import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import HomeControlPanelButton from "@/components/HomeControlPanelButton";
import HomeVideoSpotlight from "@/components/HomeVideoSpotlight";
import LatestWorkshopVideos from "@/components/LatestWorkshopVideos";
import TeamShowcase from "@/components/TeamShowcase";
And inside the page:

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <HomeControlPanelButton />

      <HomeVideoSpotlight />

      <LatestWorkshopVideos />

      {/* rest of homepage */}
    </>
  );
}
3. Build and push
npm run build

git add -A
git commit -m "Add homepage control panel button"
git push origin main
After this, users can enter their control panel directly from the homepage without typing /admin or /dashboard. Admins go to /admin; everyone else goes to /dashboard.


Screenshot 2026-07-01 at 20.33.46.png
also the media is not in the home page

Thought for 25s
Your screenshot is from the Admin Media Library, but the homepage is not reading those media items yet.

Use this full solution:

/admin/media → add/delete homepage media
/ homepage → shows the same media
1. Run this SQL in Supabase
create extension if not exists pgcrypto;

create table if not exists public.home_media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  media_type text default 'image',
  media_url text,
  button_text text default 'Learn more',
  button_href text default '/workshops',
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.home_media_items add column if not exists title text;
alter table public.home_media_items add column if not exists description text;
alter table public.home_media_items add column if not exists media_type text default 'image';
alter table public.home_media_items add column if not exists media_url text;
alter table public.home_media_items add column if not exists button_text text default 'Learn more';
alter table public.home_media_items add column if not exists button_href text default '/workshops';
alter table public.home_media_items add column if not exists display_order integer default 0;
alter table public.home_media_items add column if not exists is_active boolean default true;
alter table public.home_media_items add column if not exists created_at timestamptz default now();
alter table public.home_media_items add column if not exists updated_at timestamptz default now();

alter table public.home_media_items enable row level security;

drop policy if exists "Public can view active home media items" on public.home_media_items;

create policy "Public can view active home media items"
on public.home_media_items
for select
using (is_active = true);

notify pgrst, 'reload schema';
2. Create homepage media component
Create:

cd "/Users/afzaal/Xiao/Lexdata/course-platform-mvp-v2 2"

code components/HomeMediaShowcase.tsx
Paste:

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeMediaItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  button_text?: string | null;
  button_href?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

function getYouTubeVideoId(url?: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || null;
      }
    }

    if (host === "youtu.be") {
      return parsedUrl.pathname.replace("/", "").split("?")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url?: string | null) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1`;
}

function isDirectVideo(url?: string | null) {
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".mp4") ||
    lowered.includes(".webm") ||
    lowered.includes(".mov") ||
    lowered.includes(".m4v")
  );
}

function isImage(url?: string | null, mediaType?: string | null) {
  if (mediaType === "image") return true;
  if (!url) return false;

  const lowered = url.toLowerCase();

  return (
    lowered.includes(".jpg") ||
    lowered.includes(".jpeg") ||
    lowered.includes(".png") ||
    lowered.includes(".webp") ||
    lowered.includes(".gif") ||
    lowered.includes("supabase")
  );
}

function MediaPreview({ item }: { item: HomeMediaItem }) {
  const mediaUrl = item.media_url;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  if (!mediaUrl) {
    return (
      <div className="flex h-64 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
        No media
      </div>
    );
  }

  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        title={item.title || "Homepage media"}
        className="h-64 w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (item.media_type === "video" || isDirectVideo(mediaUrl)) {
    return (
      <video
        src={mediaUrl}
        controls
        playsInline
        className="h-64 w-full object-cover"
      />
    );
  }

  if (isImage(mediaUrl, item.media_type)) {
    return (
      <img
        src={mediaUrl}
        alt={item.title || "Homepage media"}
        className="h-64 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-64 items-center justify-center bg-slate-950 p-6 text-center">
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
      >
        Open media
      </a>
    </div>
  );
}

export default async function HomeMediaShowcase() {
  noStore();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("home_media_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("HomeMediaShowcase error:", error.message);
    return null;
  }

  const items = (data ?? []) as HomeMediaItem[];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
              LexData Media
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Training, research, and learning highlights
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore LexData training sessions, research support, and online
              learning programs.
            </p>
          </div>

          <Link
            href="/workshops"
            className="w-fit rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Explore workshops
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <MediaPreview item={item} />

              <div className="p-7">
                <h3 className="text-2xl font-black text-slate-950">
                  {item.title}
                </h3>

                {item.description ? (
                  <p className="mt-4 text-lg leading-8 text-slate-600">
                    {item.description}
                  </p>
                ) : null}

                {item.button_href ? (
                  <Link
                    href={item.button_href}
                    className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    {item.button_text || "Learn more"}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
3. Replace admin media actions
Create:

mkdir -p app/admin/media