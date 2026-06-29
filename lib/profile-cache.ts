import { revalidatePath, revalidateTag } from "next/cache"
import { publicCacheTags } from "@/lib/cache-tags"

export function revalidateProfileContent() {
  try {
    revalidateTag(publicCacheTags.profile, "max")
    revalidatePath("/kabinet")
    revalidatePath("/kabinet/[slug]", "page")
    revalidatePath("/kabinet/pengurus-inti/[slug]", "page")
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Profile cache revalidation skipped", error)
    }
  }
}
