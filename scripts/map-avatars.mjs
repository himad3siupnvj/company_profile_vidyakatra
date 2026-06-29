import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function run() {
  const fotoDir = path.resolve(__dirname, '../foto');
  const files = await getFiles(fotoDir);
  const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  
  const members = await db.execute('SELECT id, name, position FROM members');
  
  const updates = [];
  
  for (const file of imageFiles) {
    const relativePath = path.relative(fotoDir, file).replace(/\\/g, '/');
    const filename = path.basename(file).toLowerCase();
    
    // Fuzzy matching logic
    // We try to find a member whose name or position keywords match the filename
    let bestMatch = null;
    let bestScore = 0;
    
    for (const member of members) {
      const nameParts = member.name.toLowerCase().split(' ');
      const posParts = member.position.toLowerCase().split(' ');
      
      let score = 0;
      for (const part of nameParts) {
        if (part.length > 2 && filename.includes(part)) score += 2;
      }
      for (const part of posParts) {
        if (part.length > 2 && filename.includes(part)) score += 1;
      }
      // Specific overrides:
      if (filename.includes('sekre1') && member.position === 'Sekretaris 1') score += 10;
      if (filename.includes('sekre2') && member.position === 'Sekretaris 2') score += 10;
      if (filename.includes('bendahara1') && member.position === 'Bendahara 1') score += 10;
      if (filename.includes('bendahara2') && member.position === 'Bendahara 2') score += 10;
      if (filename.includes('ketum1') && member.position === 'Ketua Umum') score += 10;
      if (filename.includes('waketum') && member.position === 'Wakil Ketua') score += 10;
      if (filename.includes('koor') && member.position === 'Koordinator Departemen' && !filename.includes('wakoor')) score += 10;
      if (filename.includes('wakoor') && member.position === 'Wakil Koordinator Departemen') score += 10;
      if (filename.includes('awa') && member.name === 'Zahwa Dzakira Mufida') score += 10;
      if (filename.includes('ojan') && member.name === 'Fauzan Faturrahman') score += 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = member;
      }
    }
    
    if (bestMatch && bestScore > 0) {
      const url = `https://jjjlsnwmqckeqjuzbldj.supabase.co/storage/v1/object/public/vidyakatra/pengurus/${relativePath}`;
      console.log(`Matched ${relativePath} to ${bestMatch.name} (${bestMatch.position}) score: ${bestScore}`);
      updates.push({ id: bestMatch.id, url });
    } else {
      console.log(`NO MATCH FOR: ${relativePath}`);
    }
  }
  
  // Execute updates
  for (const update of updates) {
    await db.execute(sql`UPDATE members SET avatar_url = ${update.url} WHERE id = ${update.id}`);
  }
  
  console.log(`Updated ${updates.length} members`);
  process.exit(0);
}

run();
