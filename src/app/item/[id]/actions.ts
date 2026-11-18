"use server";

import { createSupabaseClient } from "@/lib/supabase";

export type MessageState = { success?: boolean; message?: string; errors?: { buyerEmail?: string; body?: string } };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendSellerMessage(listingId: string, sellerEmail: string, _previous: MessageState, formData: FormData): Promise<MessageState> {
  const buyerEmail = String(formData.get("buyerEmail") ?? "").trim().toLowerCase();
  const body = String(formData.get("message") ?? "").trim();
  const errors: NonNullable<MessageState["errors"]> = {};
  if (!emailPattern.test(buyerEmail)) errors.buyerEmail = "Enter a valid email address.";
  if (body.length < 10 || body.length > 2000) errors.body = "Message must be between 10 and 2,000 characters.";
  if (Object.keys(errors).length) return { errors, message: "Please check your message." };

  const { error } = await createSupabaseClient().from("messages").insert({ listing_id: listingId, buyer_email: buyerEmail, seller_email: sellerEmail, message: body });
  if (error) return { message: `Message could not be sent: ${error.message}` };
  return { success: true, message: "Message sent to the seller." };
}
