import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'vidyakatra';
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = postgres(databaseUrl, { ssl: 'require' });

// Map filename stem → unit name substring for matching
const LOGO_DIR = path.resolve(__dirname, '../assets/organ');

async function uploadOrgLogos() {
  const files = await fs.readdir(LOGO_DIR);
  const images = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

  console.log(`Found ${images.length} logo files:`, images);

  // Fetch all active organizational units
  const units = await sql`
    SELECT id, name, type FROM organizational_units
    WHERE deleted_at IS NULL
    ORDER BY name
  `;
  console.log(`Found ${units.length} units in DB:`, units.map(u => u.name));

  // Manual aliases: file stem → unit name substring
  const ALIASES = {
    'ekraf': 'ekonomi kreatif',
    'humsiwa': 'hubungan mahasiswa',
    'medkom': 'media dan komunikasi',
    'psdm': 'pengembangan sumber daya',
    'sospol': 'sosial politik',
    'pendidikan': 'pendidikan',
    'koordept': 'koordinator', // may not be in units
  };

  for (const fileName of images) {
    const filePath = path.join(LOGO_DIR, fileName);
    const stem = path.basename(fileName, path.extname(fileName)).toLowerCase().replace(/\s+/g, '');
    const aliasTarget = ALIASES[stem];

    // Try to match to a unit
    const unit = units.find(u => {
      const uName = u.name.toLowerCase();
      if (aliasTarget) return uName.includes(aliasTarget);
      return uName.replace(/\s+/g, '').includes(stem) || stem.includes(uName.replace(/\s+/g, ''));
    });

    if (!unit) {
      console.warn(`⚠️  No match for: ${fileName} (stem: ${stem})`);
      continue;
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const storagePath = `organization-image/${unit.type === 'bureau' ? 'bureaus' : 'departments'}/${stem}_${Date.now()}.${ext}`;

    console.log(`Uploading ${fileName} → ${unit.name} (${storagePath})...`);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error(`  ❌ Upload failed: ${error.message}`);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

    await sql`
      UPDATE organizational_units
      SET image_url = ${publicUrl}, updated_at = NOW()
      WHERE id = ${unit.id}
    `;

    console.log(`  ✅ Done → ${publicUrl}`);
  }

  console.log('\nAll done!');
  await sql.end();
}

uploadOrgLogos().catch(err => {
  console.error(err);
  process.exit(1);
});
