import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

async function confirmCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  const admin = createAdminClient();
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) throw new Error("Stripe session is missing payment_id metadata");

  const { data: payment, error } = await admin
    .from("payments")
    .select("id,user_id,product_type,product_id,amount_cents,currency,status")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !payment) throw new Error(error?.message || "Payment record not found");
  if (payment.user_id !== session.metadata?.user_id) {
    throw new Error("Stripe user metadata does not match the payment owner");
  }
  if (session.amount_total == null || session.amount_total !== payment.amount_cents) {
    throw new Error("Confirmed Stripe amount does not match the expected amount");
  }
  if (session.currency?.toLowerCase() !== String(payment.currency).toLowerCase()) {
    throw new Error("Confirmed Stripe currency does not match the expected currency");
  }

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const { data: updatedPayments, error: updateError } = await admin
    .from("payments")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .neq("status", "paid")
    .select("id");

  if (updateError) throw new Error(updateError.message);

  if (updatedPayments?.length) {
    await admin.from("internal_messages").insert({
      user_id: payment.user_id,
      title: "Payment confirmed and receipt released",
      body: "Stripe confirmed your payment. Your receipt is now available under Certificates & Receipts.",
      source_type: "payment_receipt_issued",
      source_id: payment.id,
    });
  }

  if (payment.product_type === "course") {
    await admin.from("enrollments").upsert(
      { user_id: payment.user_id, course_id: payment.product_id, status: "active" },
      { onConflict: "user_id,course_id" }
    );
  } else if (payment.product_type === "workshop") {
    await admin.from("workshop_registrations").upsert(
      {
        user_id: payment.user_id,
        session_id: payment.product_id,
        status: "registered",
        payment_id: payment.id,
      },
      { onConflict: "user_id,session_id" }
    );
  }
}

async function voidRefundedReceipt(charge: Stripe.Charge) {
  const paymentIntent =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntent) return;

  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntent);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const event = stripe.webhooks.constructEvent(await request.text(), signature, secret);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await confirmCheckout(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "charge.refunded") {
      await voidRefundedReceipt(event.data.object as Stripe.Charge);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook rejected:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook rejected" },
      { status: 400 }
    );
  }
}
