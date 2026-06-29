import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL);

const mapping = {
  "Nur Amelia Ramadhani": "bph/amel-sekre1.png",
  "Nilam Rahma Sari": "bph/nilam-sekre2.png",
  "Nabila Ramadhani": "bph/nabila-bendahara1.png",
  "Devina Salsabila": "bph/devina-bendahara2.png",
  "Ahmad Ghazy Faiz": "koor/ghazy-koor.png",
  "Siti Hanifah": "koor/hanifah-wakoor.png",
  "Naila Safynatul Husna": "pendidikan/naila-kepala-pendidikan.png",
  "Razky Ega Handaru": "pendidikan/akademik/razky-kepala-akademik.png",
  "Nur Sekar Shalia Haafidz": "pendidikan/mikat/sekar-kepala-mikat.png",
  "Alayavaro Rachmadia": "pendidikan/akademik/alayavaro-staf-akademik.png",
  "Haniyah Ramadani": "pendidikan/mikat/haniyah-staf-mikat.png",
  "Febi Aprilia": "sospol/febi-kepala sospol.png",
  "Dinda Ayu Apriliani": "pendidikan/akademik/dinda-staf-akademik.png",
  "Muhammad Farrel Fauzan": "pendidikan/akademik/farel-staf-akademik.png",
  "Muhammad Nabil Irpi Syafei": "pendidikan/mikat/nabil-staf-mikat.png",
  "Abdul Rohman Irwansyah": "sospol/abdul-staf-sospol.png",
  "Satria Putra Darmawansyah": "sospol/satria-staf-sospol.png",
  "Nabiel Prabaswara Muhammad Maritza Bayanaka": "sospol/nabiel-staf-sospol.png",
  "Hakim Syawatul Fitrah": "sospol/hakim-staf-sospol.png",
  "Muhamad Fauzi Achsan": "humsiwa/oji-kepala-humsiwa.png",
  "Rayla Thoriq Hafuza": "humsiwa/thorid-wakil-kepala-humsiwa.png",
  "Heru Chandra": "humsiwa/heru-staf-humsiwa.png",
  "Bintang Marzomuto Alharits Santoni": "humsiwa/bintang-staf-humsiwa.png",
  "Kwein Zaida Cahya": "humsiwa/kwein-staf-humsiwa.png",
  "Sulthon Ahmad Yassar": "humsiwa/sulthon-staf-humsiwa.png",
  "Delia Ayu Nandhita": "humsiwa/adel-staf-humsiwa.png",
  "Panji Anugerah Panengah": "ekraf/panji-kepala-ekraf.png",
  "Anin Najwa Salsabila": "ekraf/anin-wakil-kepala-ekraf.png",
  "Wifa Astutiningtyas": "ekraf/kwu/wifa-kepala-kwu.png",
  "Fauzan Faturrahman": "ekraf/sponsor/fauzan-kepala-sponsor.png",
  "Muhammad Alfridho Pasha": "ekraf/sponsor/pasha-staf-sponsor.png",
  "Rico Indra Kusuma": "ekraf/sponsor/rico-staf-sponsor.png",
  "Benita Aryani": "medkom/benita-kepala-medkom.png",
  "Khresna Bayu Adji Purnomo": "ekraf/kwu/bayu-staf-kwu.png",
  "Intan Oktaviani": "ekraf/kwu/intan-staf-kwu.png",
  "Hana Khaila": "psdm/hana-kepala-psdm.png",
  "Nadhirah Dwi Lindra": "psdm/pi/dhira-kepala-pi.png",
  "Zetta Yemima Arini Uktolseja": "psdm/kader/zetta-kepala-kader.png",
  "Fathussabil": "psdm/kader/sabil-staf-kader.png",
  "Siti Zahra": "medkom/kreatif/zahra-staf-kreatif.png",
  "Muhammad Rakha Bramundito Ardan": "psdm/pi/ardan-staf-pi.png",
  "Fahri Ibrahim": "psdm/kader/fahri-staf-kader.png",
  "Zahwa Dzakira Mufida": "psdm/pi/awa-staf-pi.png",
  "Rizki Ramadhan": "medkom/humas/rizki-kepala-humas.png",
  "Syifa Azziza Amelia Shahab": "medkom/kreatif/syifa-kepala-kreatif.png",
  "Chelsea Poibe": "medkom/humas/chelsea-staf-humas.png",
  "Annisa Nurul Khotimah": "medkom/humas/annisa-staf-humas.png",
  "Fathan Andhika Daffa Putra Adhiwibowo": "medkom/kreatif/daffa-staf-kreatif.png",
  "Fiona Melinda Permana Putri": "medkom/kreatif/fio-staf-kreatif.png"
};

async function run() {
  const baseUrl = "https://jjjlsnwmqckeqjuzbldj.supabase.co/storage/v1/object/public/vidyakatra/pengurus/";
  let count = 0;
  for (const [name, file] of Object.entries(mapping)) {
    const url = baseUrl + file;
    await sql`UPDATE members SET avatar_url = ${url} WHERE name = ${name}`;
    console.log(`Updated ${name} -> ${file}`);
    count++;
  }
  
  console.log(`Successfully updated ${count} members.`);
  process.exit(0);
}

run().catch(console.error);
