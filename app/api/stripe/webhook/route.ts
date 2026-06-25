import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const paymentId = metadata.payment_id;
    const userId = metadata.user_id;
    const productType = metadata.product_type;
    const productId = metadata.product_id;

    if (paymentId && userId && productType && productId) {
      const admin = createAdminClient();

      await admin
        .from("payments")
        .update({
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (productType === "course") {
        await admin.from("enrollments").upsert({
          user_id: userId,
          course_id: productId,
          status: "active"
        });
      }

      if (productType === "workshop") {
        await admin.from("workshop_registrations").upsert({
          user_id: userId,
          session_id: productId,
          status: "registered",
          payment_id: paymentId
        });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.payment_id;
    if (paymentId) {
      const admin = createAdminClient();
      await admin
        .from("payments")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", paymentId);
    }
  }

  return NextResponse.json({ received: true });
}
