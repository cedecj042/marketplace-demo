"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Info, LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories, formatPrice } from "@/lib/marketplace-data";

type Preview = { title: string; price: string; category: string; condition: string; description: string; location: string; sellerEmail: string };
type FormErrors = Partial<Record<"title" | "price" | "category" | "sellerEmail" | "image", string>>;
const emptyListing: Preview = { title: "", price: "", category: "", condition: "", description: "", location: "Palo Alto, CA", sellerEmail: "" };

export function CreateListingForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview>(emptyListing);
  const [imagePreview, setImagePreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<{ message: string; success: boolean }>({ message: "", success: false });
  const fileInput = useRef<HTMLInputElement>(null);

  function update(field: keyof Preview) { return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPreview((current) => ({ ...current, [field]: event.target.value })); }
  function chooseFile(file?: File) { if (file?.type.startsWith("image/")) { if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(URL.createObjectURL(file)); const transfer = new DataTransfer(); transfer.items.add(file); if (fileInput.current) fileInput.current.files = transfer.files; setErrors((current) => ({ ...current, image: undefined })); } }
  function drop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setErrors({}); setStatus({ message: "", success: false });
    const form = new FormData(event.currentTarget);
    try {
      let imageUrl: string | null = null;
      const image = form.get("image");
      if (image instanceof File && image.size > 0) {
        const upload = new FormData(); upload.set("image", image);
        const response = await fetch("/api/upload", { method: "POST", body: upload });
        const payload = await response.json() as { data?: { url: string }; error?: { message?: string; fields?: Record<string, string> } };
        if (!response.ok || !payload.data) { setErrors({ image: payload.error?.fields?.image }); throw new Error(payload.error?.message ?? "Photo upload failed."); }
        imageUrl = payload.data.url;
      }
      const response = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: preview.title, price: Number(preview.price), category: preview.category, description: preview.description, location: preview.location, seller_email: preview.sellerEmail, image_url: imageUrl }) });
      const payload = await response.json() as { data?: { id: string }; error?: { message?: string; fields?: Record<string, string> } };
      if (!response.ok || !payload.data) { const fields = payload.error?.fields ?? {}; setErrors({ title: fields.title, price: fields.price, category: fields.category, sellerEmail: fields.seller_email }); throw new Error(payload.error?.message ?? "Listing could not be published."); }
      setStatus({ message: "Listing published. Opening it now…", success: true });
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setPreview({ ...emptyListing });
      setErrors({});
      if (fileInput.current) fileInput.current.value = "";
      router.replace(`/item/${payload.data.id}`);
    } catch (reason) { setStatus({ message: reason instanceof Error ? reason.message : "Something went wrong. Please try again.", success: false }); }
    finally { setPending(false); }
  }

  return <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[420px_1fr] lg:gap-7">
    <section className="glass-panel rounded-[22px] p-5 sm:p-6"><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">New listing</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Item for sale</h1><p className="mt-1 text-sm text-muted-foreground">Create a public Marketplace listing.</p>
      <form onSubmit={submit} className="mt-6 space-y-5" autoComplete="off" noValidate>
        <div><label className="mb-2 block text-sm font-semibold" htmlFor="listing-image">Photo</label><div onDragEnter={(e) => { e.preventDefault(); setDragging(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={drop} className={`relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-[16px] border border-dashed text-sm font-semibold transition ${dragging ? "border-[#7778ff] bg-[#eeeeff]" : "bg-white/60 hover:border-[#7778ff]"}`}>
          {imagePreview ? <><Image src={imagePreview} alt="Listing preview" fill unoptimized className="object-cover" /><button type="button" aria-label="Remove photo" onClick={() => { URL.revokeObjectURL(imagePreview); setImagePreview(""); if (fileInput.current) fileInput.current.value = ""; }} className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-xl bg-white shadow"><X className="size-4" /></button></> : <button type="button" onClick={() => fileInput.current?.click()} className="flex h-full w-full flex-col items-center justify-center"><Upload className="mb-2 size-6 text-[#5b5cf0]" />Drag a photo here or click to browse<span className="mt-1 text-xs font-normal text-muted-foreground">JPG, PNG or WebP · Max 6 MB</span></button>}
          <input ref={fileInput} id="listing-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </div>{errors.image && <p className="mt-1 text-xs text-destructive">{errors.image}</p>}</div>
        <Field label="Title" error={errors.title}><Input value={preview.title} onChange={update("title")} className="mt-2 h-11" placeholder="What are you selling?" maxLength={255} required aria-invalid={!!errors.title} /></Field>
        <Field label="Price" error={errors.price}><Input value={preview.price} onChange={(event) => setPreview((current) => ({ ...current, price: event.target.value.replace(/[^0-9.]/g, "") }))} className="mt-2 h-11" inputMode="decimal" placeholder="₱ Price" required aria-invalid={!!errors.price} /></Field>
        <Field label="Category" error={errors.category}><select value={preview.category} onChange={update("category")} className="mt-2 h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-[#1877f2]" required aria-invalid={!!errors.category}><option value="">Select a category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></Field>
        <Field label="Condition"><select value={preview.condition} onChange={update("condition")} className="mt-2 h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none"><option value="">Select condition</option><option>New</option><option>Like new</option><option>Good</option><option>Fair</option></select></Field>
        <Field label="Description"><Textarea value={preview.description} onChange={update("description")} className="mt-2 min-h-28" placeholder="Tell buyers about your item" /></Field>
        <Field label="Location"><Input value={preview.location} onChange={update("location")} className="mt-2 h-11" required /></Field>
        <Field label="Seller email" error={errors.sellerEmail}><Input type="email" value={preview.sellerEmail} onChange={update("sellerEmail")} className="mt-2 h-11" placeholder="you@example.com" required aria-invalid={!!errors.sellerEmail} /></Field>
        <div className="flex gap-2 rounded-lg bg-[#f0f2f5] p-3 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Your email is used so interested buyers can contact you.</div>
        {status.message && <p role="status" aria-live="polite" className={`flex items-center gap-2 rounded-lg p-3 text-sm ${status.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-destructive"}`}>{status.success && <CheckCircle2 className="size-4" />}{status.message}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-[#111827] shadow-[0_14px_25px_-16px_#111827] hover:bg-[#252d3c]">{pending ? <><LoaderCircle className="animate-spin" /> Publishing…</> : "Publish listing"}</Button>
      </form>
    </section>
    <section className="glass-panel mt-6 hidden rounded-[22px] p-6 lg:block"><p className="text-[10px] font-semibold tracking-[0.18em] text-[#6465dc] uppercase">Live view</p><h2 className="mb-4 mt-1 text-xl font-semibold">Preview</h2><div className="sticky top-24 overflow-hidden rounded-[18px] border border-white bg-white/80 ring-1 ring-[#e1e4ec]"><div className="relative grid aspect-[16/10] place-items-center bg-gradient-to-br from-[#eeefff] to-[#ecf7fb] text-center text-sm text-muted-foreground">{imagePreview ? <Image src={imagePreview} alt="Listing preview" fill unoptimized className="object-cover" /> : <div><ImagePlus className="mx-auto mb-2 size-10 text-[#7778a0]" />Your photo will appear here</div>}</div><div className="p-6"><h2 className="text-xl font-semibold tracking-tight">{preview.title || "Listing title"}</h2><p className="mt-1 text-lg font-semibold">{preview.price && Number(preview.price) > 0 ? formatPrice(Number(preview.price)) : "Price"}</p><p className="mt-2 text-sm text-muted-foreground">{preview.location || "Location"}{preview.condition && ` · ${preview.condition}`}</p><hr className="my-5" /><h3 className="font-semibold">Details</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{preview.description || "Your description will appear here."}</p></div></div></section>
  </main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}{error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}</label>; }
