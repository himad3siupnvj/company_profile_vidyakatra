import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

async function parseEnv() {
  const content = await fs.readFile(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
}

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function uploadFiles() {
  const env = await parseEnv();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = env.SUPABASE_STORAGE_BUCKET || 'vidyakatra';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const fotoDir = path.resolve(__dirname, '../foto');
  
  try {
    const files = await getFiles(fotoDir);
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
    
    console.log(`Found ${imageFiles.length} images to upload.`);
    
    for (const file of imageFiles) {
      const relativePath = path.relative(fotoDir, file).replace(/\\/g, '/');
      
      console.log(`Uploading ${relativePath}...`);
      
      const fileBuffer = await fs.readFile(file);
      const contentType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // Supabase Storage REST API path
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/pengurus/${relativePath}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: fileBuffer
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error uploading ${relativePath}: ${response.status} ${response.statusText}`, errorText);
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
