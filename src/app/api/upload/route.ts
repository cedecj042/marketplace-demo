import { apiError } from "@/lib/api";
import { requireClaims } from "@/lib/supabase-server";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const maxSize = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const { supabase, claims } = await requireClaims();
  if (!claims) return apiError("UNAUTHORIZED", "Sign in to upload listing images.", 401);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) return apiError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be multipart/form-data.", 415);
  let formData: FormData;
  try { formData = await request.formData(); } catch { return apiError("INVALID_FORM_DATA", "The multipart form data could not be read.", 400); }
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return apiError("VALIDATION_ERROR", "An image file is required in the 'image' field.", 422, { image: "Choose a file to upload." });
  if (!allowedTypes.has(image.type)) return apiError("UNSUPPORTED_FILE_TYPE", "Only JPG, PNG, and WebP images are supported.", 415, { image: "Unsupported image format." });
  if (image.size > maxSize) return apiError("PAYLOAD_TOO_LARGE", "Image must be 6 MB or smaller.", 413, { image: "File exceeds the 6 MB limit." });
  const path = `${claims.sub}/${crypto.randomUUID()}.${allowedTypes.get(image.type)}`;
  // Convert the Web File into a plain ArrayBuffer for consistent uploads in
  // Node, serverless, and edge-compatible route-handler runtimes.
  const bytes = await image.arrayBuffer();
  const { error } = await supabase.storage.from("listing-images").upload(path, bytes, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (error) { console.error("Supabase storage error", { message: error.message }); return apiError("UPLOAD_FAILED", "Image could not be uploaded.", 500); }
  const publicUrl = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
  return Response.json({ data: { path, url: publicUrl, contentType: image.type, size: image.size } }, { status: 201 });
}
