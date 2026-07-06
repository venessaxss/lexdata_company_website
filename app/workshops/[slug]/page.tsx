import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";
import PaymentReceiptUploadForm from "@/components/PaymentReceiptUploadForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================
   TYPES
========================= */

type Workshop = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  long_description?: string | null;
  price?: number | null;
  currency?: string | null;
  is_published?: boolean | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type Registration = {
  id: string;
  workshop_id: string;
  user_id: string;
  registration_status?: string | null;
  payment_status?: string | null;
  receipt_url?: string | null;
  payment_note?: string | null;
  payment_link?: string | null;
  amount_received?: number | null;
  payment_currency?: string | null;
};

/* =========================
   PAGE PROPS
========================= */

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ message?: string | string[] }>;
};

/* =========================
   HELPERS
========================= */

function cleanMessage(msg: string) {
  return encodeURIComponent(msg);
}

/* =========================
   REGISTER ACTION
========================= */

async function registerForWorkshopAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug"));
  const workshopId = String(formData.get("workshop_id"));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/workshops/${slug}`);
  }

  const admin = createAdminClient();

  const { data: workshop } = await admin
    .from("workshops")
    .select("*")
    .eq("id", workshopId)
    .maybeSingle();

  if (!workshop) {
    redirect(`/workshops/${slug}?message=${cleanMessage("Workshop not found")}`);
  }

  const { data: existing } = await admin
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/workshops/${slug}?message=${cleanMessage("Already registered")}`);
  }

  const isFree = Number(workshop.price || 0) === 0;

  const { error } = await admin.from("workshop_registrations").insert({
    workshop_id: workshopId,
    user_id: user.id,
    full_name: user.email?.split("@")[0] ?? "User",
    email: user.email,
    registration_status: isFree ? "confirmed" : "pending",
    payment_status: isFree ? "waived" : "pending",
    amount_received: 0,
    payment_currency: workshop.currency || "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/workshops/${slug}?message=${cleanMessage(error.message)}`);
  }

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");

  redirect(
    `/workshops/${slug}?message=${cleanMessage(
      isFree ? "Registered successfully" : "Waiting for payment instructions"
    )}`
  );
}

/* =========================
   MAIN PAGE
========================= */

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: PageProps) {
  noStore();

  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const message = Array.isArray(sp.message) ? sp.message[0] : sp.message;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* =========================
     WORKSHOP FETCH
  ========================= */

  const { data: workshop } = await admin
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!workshop) notFound();

  /* =========================
     REGISTRATION FETCH
  ========================= */

  let registration: Registration | null = null;

  if (user) {
    const { data } = await admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = data;
  }

  /* =========================
     ACCESS LOGIC (FIXED)
  ========================= */

  const canAccess =
    registration?.registration_status === "confirmed" ||
    registration?.payment_status === "confirmed" ||
    registration?.payment_status === "waived";

  const canUploadReceipt =
    !!registration &&
    registration.payment_status !== "confirmed" &&
    registration.payment_status !== "waived";

  /* =========================
     UI
  ========================= */

  return (
    <main className="p-6">
      {message && (
        <div className="mb-4 bg-blue-50 p-3 rounded">
          {message}
        </div>
      )}

      <h1 className="text-2xl font-bold">{workshop.title}</h1>

      {/* REGISTER */}
      {!registration && (
        <form action={registerForWorkshopAction}>
          <input type="hidden" name="slug" value={workshop.slug} />
          <input type="hidden" name="workshop_id" value={workshop.id} />

          <button className="mt-4 bg-black text-white px-4 py-2 rounded">
            Register
          </button>
        </form>
      )}

      {/* RECEIPT UPLOAD */}
      {canUploadReceipt && (
        <PaymentReceiptUploadForm
          slug={workshop.slug}
          workshopId={workshop.id}
          registrationId={registration!.id}
          receiptUrl={registration?.receipt_url}
        />
      )}

      {/* ACCESS */}
      <div className="mt-6">
        {canAccess ? (
          <p className="text-green-600 font-bold">
            Access Granted
          </p>
        ) : (
          <p className="text-red-500">
            Access Locked
          </p>
        )}
      </div>

      {/* PAYMENT INFO */}
      {registration?.payment_note && (
        <div className="mt-4 bg-yellow-50 p-3 rounded">
          {registration.payment_note}
        </div>
      )}
    </main>
  );
}