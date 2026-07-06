import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";
import PaymentReceiptUploadForm from "@/components/PaymentReceiptUploadForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Workshop = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  long_description?: string | null;
  audience?: string | null;
  price?: number | null;
  currency?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  is_published?: boolean | null;
  recruitment_status?: string | null;
  process_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type Registration = {
  id: string;
  workshop_id: string;
  user_id: string;
  registration_status?: string | null;
  payment_status?: string | null;
  payment_link?: string | null;
  payment_note?: string | null;
  receipt_url?: string | null;
  payment_currency?: string | null;
  amount_received?: number | null;
};

type Profile = {
  role?: string | null;
  full_name?: string | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ message?: string | string[] }>;
};

function cleanRedirectMessage(message: string) {
  return encodeURIComponent(message);
}

/* =========================
   REGISTRATION ACTION
========================= */
async function registerForWorkshopAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") || "").trim();
  const workshopId = String(formData.get("workshop_id") || "").trim();

  if (!slug || !workshopId) {
    redirect("/workshops");
  }

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
    .select("id, title, price, currency")
    .eq("id", workshopId)
    .maybeSingle();

  if (!workshop) {
    redirect(`/workshops/${slug}?message=Workshop not found`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const userEmail =
    profile?.email || user.email || user.user_metadata?.email || "";

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    userEmail.split("@")[0] ||
    "Participant";

  const { data: existingRegistration } = await admin
    .from("workshop_registrations")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRegistration) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        "Already registered."
      )}`
    );
  }

  const isFree = Number(workshop.price || 0) === 0;

  const registrationStatus = isFree ? "confirmed" : "pending";
  const paymentStatus = isFree ? "waived" : "pending";

  const { error } = await admin.from("workshop_registrations").insert({
    workshop_id: workshopId,
    user_id: user.id,
    full_name: fullName,
    email: userEmail,
    registration_status: registrationStatus,
    payment_status: paymentStatus,
    payment_currency: workshop.currency || "USD",
    amount_received: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/workshops/${slug}?message=${cleanRedirectMessage(
        error.message
      )}`
    );
  }

  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/manager/registrations");
  revalidatePath("/admin/registrations");

  redirect(
    `/workshops/${slug}?message=${cleanRedirectMessage(
      isFree
        ? "Registered successfully."
        : "Registration submitted. Wait for payment instructions."
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
  const sp = searchParams ? await searchParams : {};
  const message = Array.isArray(sp.message)
    ? sp.message[0]
    : sp.message;

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workshop } = await admin
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!workshop) notFound();

  let existingRegistration: Registration | null = null;

  if (user) {
    const { data } = await admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    existingRegistration = data;
  }

  const registrationStatus =
    existingRegistration?.registration_status || "pending";

  const paymentStatus =
    existingRegistration?.payment_status || "pending";

  const canUploadReceipt =
    !!existingRegistration &&
    paymentStatus !== "confirmed" &&
    paymentStatus !== "waived";

  const canAccess =
    registrationStatus === "confirmed" ||
    paymentStatus === "confirmed" ||
    paymentStatus === "waived";

  return (
    <main className="p-6">
      {message && (
        <div className="mb-4 bg-blue-50 p-3 rounded">
          {message}
        </div>
      )}

      <h1 className="text-2xl font-bold">{workshop.title}</h1>

      {/* Registration */}
      {!existingRegistration && (
        <form action={registerForWorkshopAction}>
          <input type="hidden" name="slug" value={workshop.slug} />
          <input type="hidden" name="workshop_id" value={workshop.id} />

          <button className="mt-4 bg-black text-white px-4 py-2 rounded">
            Register
          </button>
        </form>
      )}

      {/* Receipt Upload */}
      {canUploadReceipt && (
        <PaymentReceiptUploadForm
          slug={workshop.slug}
          workshopId={workshop.id}
          registrationId={existingRegistration!.id}
          receiptUrl={existingRegistration?.receipt_url}
        />
      )}

      {/* Access */}
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
    </main>
  );
}