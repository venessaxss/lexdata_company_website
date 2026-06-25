"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

export async function createCheckout(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const stripe = getStripe();

  const productType = String(formData.get("product_type") ?? "");
  const productId = String(formData.get("product_id") ?? "");

  if (!productId || !["course", "workshop"].includes(productType)) {
    redirect("/dashboard?message=Invalid checkout request");
  }

  let title = "Training product";
  let amountCents = 0;
  let currency = "usd";
  let stripePriceId: string | null = null;
  let cancelUrl = `${getSiteUrl()}/dashboard`;

  if (productType === "course") {
    const { data: course, error } = await supabase
      .from("courses")
      .select("id,title,slug,price_cents,currency,stripe_price_id")
      .eq("id", productId)
      .single();

    if (error || !course) redirect("/courses?message=Course not found");

    title = course.title;
    amountCents = course.price_cents ?? 0;
    currency = course.currency ?? "usd";
    stripePriceId = course.stripe_price_id;
    cancelUrl = `${getSiteUrl()}/courses/${course.slug}`;

    if (amountCents <= 0) {
      await supabase.from("enrollments").upsert({
        user_id: user.id,
        course_id: productId,
        status: "active"
      });
      redirect("/my/courses");
    }
  }

  if (productType === "workshop") {
    const { data: session, error } = await supabase
      .from("workshop_sessions")
      .select("id,title,price_cents,currency,stripe_price_id,workshops(slug,title)")
      .eq("id", productId)
      .single();

    if (error || !session) redirect("/workshops?message=Workshop session not found");

    title = session.title;
    amountCents = session.price_cents ?? 0;
    currency = session.currency ?? "usd";
    stripePriceId = session.stripe_price_id;
    const workshopSlug = (session.workshops as any)?.slug ?? "";
    cancelUrl = `${getSiteUrl()}/workshops/${workshopSlug}`;

    if (amountCents <= 0) {
      await supabase.from("workshop_registrations").upsert({
        user_id: user.id,
        session_id: productId,
        status: "registered"
      });
      redirect("/my/workshops");
    }
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      product_type: productType,
      product_id: productId,
      amount_cents: amountCents,
      currency,
      status: "pending"
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    redirect(`/dashboard?message=${encodeURIComponent(paymentError?.message ?? "Could not create payment")}`);
  }

  const lineItem = stripePriceId
    ? { price: stripePriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: { name: title }
        }
      };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    line_items: [lineItem],
    success_url: `${getSiteUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      payment_id: payment.id,
      user_id: user.id,
      product_type: productType,
      product_id: productId
    }
  });

  await supabase
    .from("payments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", payment.id);

  if (!session.url) redirect("/dashboard?message=Stripe did not return a checkout URL");
  redirect(session.url);
}
