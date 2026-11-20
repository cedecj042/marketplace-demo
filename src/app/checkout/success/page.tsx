import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/payments/order-confirmation";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId = "" } = await searchParams;
  return <OrderConfirmation sessionId={sessionId} />;
}
