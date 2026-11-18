"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export type ListingFormState = {
  message?: string;
  errors?: Partial<Record<"title" | "price" | "category" | "sellerEmail" | "image", string>>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createListing(_previous: ListingFormState, formData: FormData): Promise<ListingFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "").replace(/,/g, ""));
  const category = String(formData.get("category") ?? "").trim();
  const sellerEmail = String(formData.get("sellerEmail") ?? "").trim().toLowerCase();
  const location = String(formData.get("location") ?? "").trim() || "Palo Alto, CA";
  const image = formData.get("image");
  const errors: ListingFormState["errors"] = {};

  if (title.length < 3 || title.length > 255) errors.title = "Enter a title between 3 and 255 characters.";
  if (!Number.isFinite(price) || price <= 0 || price > 99_999_999) errors.price = "Enter a valid price greater than zero.";
  if (!category) errors.category = "Choose a category.";
  if (!emailPattern.test(sellerEmail)) errors.sellerEmail = "Enter a valid email address.";
  if (image instanceof File && image.size > 0) {
    if (!allowedTypes.has(image.type)) errors.image = "Use a JPG, PNG, or WebP image.";
    if (image.size > 6 * 1024 * 1024) errors.image = "Image must be 6 MB or smaller.";
  }
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  const supabase = createSupabaseClient();
  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, image, { contentType: image.type, cacheControl: "3600", upsert: false });
    if (uploadError) return { message: `Photo upload failed: ${uploadError.message}` };
    imageUrl = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase.from("listings").insert({ title, description: description || null, price, category, seller_email: sellerEmail, image_url: imageUrl, location }).select("id").single();
  if (error || !data) return { message: `Could not publish listing: ${error?.message ?? "Unknown error"}` };

  revalidatePath("/");
  revalidatePath(`/category/${category}`);
  redirect(`/item/${data.id}`);
}
