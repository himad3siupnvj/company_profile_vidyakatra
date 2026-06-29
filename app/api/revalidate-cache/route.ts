import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { publicCacheTags } from "@/lib/cache-tags";

export async function GET() {
  revalidateTag(publicCacheTags.profile, "max");
  revalidateTag(publicCacheTags.directory, "max");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
