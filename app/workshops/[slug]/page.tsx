import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PaymentReceiptUploadForm from "@/components/PaymentReceiptUploadForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkshopDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const admin = createAdminClient();

  // -------------------------
  // USER
  // -------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -------------------------
  // WORKSHOP
  // -------------------------
  const { data: workshop } = await admin
    .from("workshops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!workshop) notFound();

  // -------------------------
  // REGISTRATION
  // -------------------------
  let registration = null;

  if (user) {
    const { data } = await admin
      .from("workshop_registrations")
      .select("*")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    registration = data;
  }

  // -------------------------
  // ACCESS LOGIC
  // -------------------------
  const canAccess =
    registration?.registration_status === "confirmed" ||
    registration?.payment_status === "confirmed" ||
    registration?.payment_status === "waived";

  const canUploadReceipt =
    registration &&
    registration.payment_status !== "confirmed" &&
    registration.payment_status !== "waived";

  // -------------------------
  // PAGE UI (IMPORTANT FIX)
  // -------------------------
  return (
    <main className="p-6 space-y-6">

      {/* WORKSHOP INFO (ALWAYS SHOW) */}
      <div>
        <h1 className="text-3xl font-bold">{workshop.title}</h1>
        <p className="text-gray-600 mt-2">
          {workshop.description}
        </p>

        <div className="mt-4 text-sm text-gray-500">
          <p>Start: {workshop.start_date}</p>
          <p>End: {workshop.end_date}</p>
          <p>Price: {workshop.price ?? "Free"}</p>
        </div>
      </div>

      {/* REGISTRATION STATUS */}
      <div className="bg-gray-50 p-4 rounded">
        <p className="font-bold">Registration</p>

        <p>Status: {registration?.registration_status ?? "Not registered"}</p>
        <p>Payment: {registration?.payment_status ?? "-"}</p>
      </div>

      {/* RECEIPT UPLOAD */}
      {canUploadReceipt && (
        <PaymentReceiptUploadForm
          slug={slug}
          workshopId={workshop.id}
          registrationId={registration.id}
          receiptUrl={registration?.receipt_url}
        />
      )}

      {/* ACCESS BLOCK */}
      <div className="mt-6">
        {canAccess ? (
          <div className="text-green-600 font-bold text-lg">
            Access Granted
          </div>
        ) : (
          <div className="text-red-500 font-bold text-lg">
            Access Locked
          </div>
        )}
      </div>

      {/* CONTENT SECTION (IMPORTANT FIX) */}
      <div className="mt-6">
        <h2 className="text-xl font-bold">Workshop Content</h2>

        {canAccess ? (
          <div className="mt-2 text-gray-700">
            {workshop.long_description ?? "No content yet."}
          </div>
        ) : (
          <p className="text-gray-400 mt-2">
            Complete registration and payment to unlock content.
          </p>
        )}
      </div>

    </main>
  );
}