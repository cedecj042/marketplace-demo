import type { Metadata } from "next";
import { CreateListingForm } from "@/components/marketplace/create-listing-form";

export const metadata: Metadata = { title: "New item listing" };

export default function CreateItemPage() {
  return <CreateListingForm />;
}
