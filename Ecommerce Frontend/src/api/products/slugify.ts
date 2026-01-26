"use server";

import { slugify } from "@/helpers/slugify";
import { createClient } from "@/lib/supabase";

export default async function slugifyProducts() {
  const supabase = createClient();
const { data: products } = await supabase.from("products").select("*");

  if (!products) return;

  type ProductRow = { id: string; title: string; slug: string | null };
  for (const product of products as ProductRow[]) {
    const newSlug = slugify(product.title);
    if (product.slug === newSlug) continue;

    const { error: updateError } = await supabase
      .from("products")
      .update({ slug: newSlug } as never)
      .eq("id", product.id);

    if (updateError) {
      console.error(`Error updating slug for product ${product.id}:`, updateError);
    }
  }

}
