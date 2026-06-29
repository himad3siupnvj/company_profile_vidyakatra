import { getPublicWorkUnits } from "@/lib/public-profile";
import { config } from "dotenv";

config();

async function main() {
  const units = await getPublicWorkUnits();
  const pendidikan = units.find(u => u.slug === 'pendidikan');
  console.log(JSON.stringify(pendidikan?.members.slice(0, 3), null, 2));
}

main().catch(console.error);
