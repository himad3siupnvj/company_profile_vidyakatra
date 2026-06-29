import { getPublicMembers } from "@/lib/public-directory";
import { config } from "dotenv";

config();

async function main() {
  const members = await getPublicMembers();
  console.log(members.slice(0, 5));
}

main().catch(console.error);
