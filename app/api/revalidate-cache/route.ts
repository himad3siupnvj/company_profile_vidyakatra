import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { publicCacheTags } from "@/lib/cache-tags";
import { requireApiPermission } from "@/lib/api-guard";

export async function GET() {
  const guard = await requireApiPermission("settings.manage");
  if (guard.response) return guard.response;

  revalidateTag(publicCacheTags.profile, "max");
  revalidateTag(publicCacheTags.directory, "max");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
