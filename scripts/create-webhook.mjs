import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!secretKey) throw new Error("STRIPE_SECRET_KEY is missing.");
if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is missing.");

const origin = new URL(siteUrl).origin;
if (!origin.startsWith("https://") || origin.includes("localhost")) {
  throw new Error("NEXT_PUBLIC_SITE_URL must be your public production HTTPS URL.");
}

const stripe = new Stripe(secretKey);
const endpoint = await stripe.webhookEndpoints.create({
  url: `${origin}/api/stripe/webhook`,
  connect: true,
  enabled_events: ["checkout.session.completed", "account.updated"],
  metadata: { marketplace: "marketplace-demo" },
});

console.log(`Webhook created: ${endpoint.id}`);
console.log(`Signing secret: ${endpoint.secret}`);
console.log("Save the signing secret as STRIPE_WEBHOOK_SECRET in .env and Vercel, then redeploy.");
