import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'vidyakatra';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function uploadFiles() {
  const fotoDir = path.resolve(__dirname, '../foto');
  
  try {
    const files = await getFiles(fotoDir);
    const pngFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    
    console.log(`Found ${pngFiles.length} images to upload.`);
    
    for (const file of pngFiles) {
      // Calculate relative path for the storage key
      const relativePath = path.relative(fotoDir, file).replace(/\\/g, '/');
      
      console.log(`Uploading ${relativePath}...`);
      
      const fileBuffer = await fs.readFile(file);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(`pengurus/${relativePath}`, fileBuffer, {
          contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
          upsert: true
        });
        
      if (error) {
        console.error(`Error uploading ${relativePath}:`, error.message);
      } else {
        console.log(`Successfully uploaded to pengurus/${relativePath}`);
      }
    }
    
    console.log('Upload complete!');
  } catch (err) {
    console.error('Error during upload:', err);
  }
}

uploadFiles();
