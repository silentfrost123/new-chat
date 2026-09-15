import { NextResponse } from "next/server";
import { getCategories, getPopularTags } from "@/lib/characters";

export async function GET() {
  const categories = getCategories();
  const tags = getPopularTags(40);
  return NextResponse.json({ categories, tags });
}
