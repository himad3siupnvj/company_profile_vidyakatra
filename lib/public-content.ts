import type { StaticImageData } from "next/image"
import type { ArticleDocument } from "@/lib/article-content"
import ekrafLogo from "@/assets/organ/ekraf.png"
import humsiwaLogo from "@/assets/organ/humsiwa.png"
import ketuaLead from "@/assets/lead/sakha-ketum1.png"
import wakilLead from "@/assets/lead/latanza-waketum.png"
import medkomLogo from "@/assets/organ/medkom.png"
import pendidikanLogo from "@/assets/organ/pendidikan.png"
import psdmLogo from "@/assets/organ/psdm.png"
import sospolLogo from "@/assets/organ/sospol.png"

export type PublicNews = {
  id: number | string
  slug: string
  title: string
  excerpt: string
  content: string[]
  document?: ArticleDocument
  date: string
  readTime: string
  author: string
  category: "berita" | "kegiatan" | "pengumuman" | "prestasi"
  image: string
  featured: boolean
  unitName: string
}

export const newsData: PublicNews[] = [
  {
    id: 1,
    slug: "workshop-ui-ux-design-bersama-praktisi-industri",
    title: "Workshop UI/UX Design Bersama Praktisi Industri",
    excerpt:
      "Tingkatkan kemampuan desain interface dengan bimbingan langsung dari profesional industri teknologi.",
    content: [
      "Workshop UI/UX Design menjadi ruang belajar praktis bagi mahasiswa D3 Sistem Informasi untuk memahami proses merancang produk digital dari sisi pengguna.",
      "Peserta diajak mengenal riset pengguna, information architecture, wireframing, hingga prinsip visual yang relevan untuk kebutuhan industri.",
      "Kegiatan ini juga membuka diskusi tentang portofolio, kerja tim, dan cara membangun solusi yang tidak hanya indah dilihat, tetapi juga mudah digunakan.",
    ],
    date: "15 Mei 2026",
    readTime: "5 min",
    author: "Tim Media",
    category: "kegiatan",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=800&fit=crop",
    featured: true,
    unitName: "Departemen Media dan Komunikasi",
  },
  {
    id: 2,
    slug: "seminar-nasional-teknologi-informasi-2026",
    title: "Seminar Nasional Teknologi Informasi 2026",
    excerpt:
      "Menghadirkan pembicara dari berbagai perusahaan teknologi terkemuka untuk berbagi insight tentang masa depan teknologi.",
    content: [
      "Seminar Nasional Teknologi Informasi 2026 membahas transformasi digital, peluang karier, serta tantangan yang akan dihadapi talenta teknologi.",
      "Melalui sesi materi dan tanya jawab, peserta mendapatkan gambaran nyata tentang kebutuhan industri dan kompetensi yang perlu dipersiapkan sejak masa kuliah.",
      "Kegiatan ini menjadi bagian dari komitmen HIMA D3 SI dalam memperluas wawasan mahasiswa melalui pengalaman belajar yang aktual dan relevan.",
    ],
    date: "10 Mei 2026",
    readTime: "4 min",
    author: "Tim Humas",
    category: "kegiatan",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop",
    featured: true,
    unitName: "",
  },
  {
    id: 3,
    slug: "kompetisi-hackathon-internal-hima",
    title: "Kompetisi Hackathon Internal HIMA",
    excerpt:
      "Ajang adu kreativitas dan kemampuan coding antar mahasiswa D3 SI untuk menciptakan solusi inovatif.",
    content: [
      "Hackathon internal HIMA menjadi wadah bagi mahasiswa untuk menguji kemampuan problem solving, kolaborasi, dan implementasi ide dalam waktu terbatas.",
      "Peserta bekerja dalam tim untuk merancang solusi digital berdasarkan tema yang ditentukan panitia.",
      "Selain kompetisi, kegiatan ini mendorong budaya eksplorasi teknologi dan keberanian untuk membangun produk dari nol.",
    ],
    date: "5 Mei 2026",
    readTime: "3 min",
    author: "Divisi Teknologi",
    category: "kegiatan",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
  {
    id: 4,
    slug: "mahasiswa-d3-si-raih-juara-1-lomba-web-development",
    title: "Mahasiswa D3 SI Raih Juara 1 Lomba Web Development",
    excerpt:
      "Tim mahasiswa D3 SI berhasil meraih juara pertama dalam kompetisi pengembangan web tingkat nasional.",
    content: [
      "Prestasi ini menjadi bukti bahwa mahasiswa D3 Sistem Informasi mampu bersaing melalui karya teknologi yang aplikatif dan berdampak.",
      "Tim membawa solusi web yang menekankan pengalaman pengguna, performa, dan relevansi terhadap masalah yang diangkat.",
      "HIMA D3 SI mengapresiasi capaian ini sebagai motivasi bagi mahasiswa lain untuk terus berkarya dan mengikuti kompetisi serupa.",
    ],
    date: "1 Mei 2026",
    readTime: "4 min",
    author: "Tim Media",
    category: "prestasi",
    image: "https://images.unsplash.com/photo-1496469888073-80de7e952517?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
  {
    id: 5,
    slug: "pendaftaran-anggota-baru-hima-2026",
    title: "Pengumuman: Pendaftaran Anggota Baru HIMA 2026",
    excerpt:
      "Dibuka pendaftaran anggota baru HIMA D3 SI periode 2026/2027 untuk mahasiswa yang ingin berkembang dan berkontribusi.",
    content: [
      "HIMA D3 SI membuka kesempatan bagi mahasiswa untuk bergabung sebagai bagian dari organisasi dan mengembangkan kapasitas diri.",
      "Pendaftaran ini ditujukan bagi mahasiswa yang memiliki minat dalam kepemimpinan, kolaborasi, komunikasi, media, teknologi, maupun kegiatan sosial.",
      "Informasi teknis pendaftaran akan diumumkan melalui kanal resmi HIMA D3 SI.",
    ],
    date: "28 April 2026",
    readTime: "2 min",
    author: "Sekretaris",
    category: "pengumuman",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
  {
    id: 6,
    slug: "kunjungan-industri-ke-perusahaan-teknologi-surabaya",
    title: "Kunjungan Industri ke Perusahaan Teknologi Surabaya",
    excerpt:
      "HIMA D3 SI mengadakan kunjungan industri untuk memberikan exposure kepada mahasiswa tentang dunia kerja.",
    content: [
      "Kunjungan industri menjadi jembatan antara pembelajaran kampus dan praktik kerja di dunia profesional.",
      "Mahasiswa mendapat kesempatan melihat langsung alur kerja, budaya tim, serta proses pengembangan produk di perusahaan teknologi.",
      "Kegiatan ini diharapkan membantu mahasiswa mempersiapkan karier sejak dini.",
    ],
    date: "20 April 2026",
    readTime: "4 min",
    author: "Divisi Humas",
    category: "kegiatan",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
  {
    id: 7,
    slug: "kolaborasi-dengan-hima-teknik-informatika",
    title: "Kolaborasi dengan HIMA Teknik Informatika",
    excerpt:
      "Kerjasama strategis antara HIMA D3 SI dan HIMA Teknik Informatika untuk mengadakan event bersama.",
    content: [
      "Kolaborasi ini membuka ruang sinergi antarorganisasi mahasiswa dalam merancang kegiatan yang lebih luas dan berdampak.",
      "Kedua himpunan membahas peluang program bersama, mulai dari seminar, workshop, hingga forum diskusi teknologi.",
      "Melalui kerja sama ini, HIMA D3 SI ingin memperkuat jejaring dan memperluas pengalaman mahasiswa.",
    ],
    date: "15 April 2026",
    readTime: "3 min",
    author: "Ketua HIMA",
    category: "berita",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
  {
    id: 8,
    slug: "tim-hima-lolos-seleksi-gemastik-2026",
    title: "Tim HIMA Lolos Seleksi GEMASTIK 2026",
    excerpt:
      "Tim dari HIMA D3 SI berhasil lolos seleksi tahap pertama GEMASTIK 2026 dalam kategori pengembangan perangkat lunak.",
    content: [
      "Keberhasilan lolos seleksi menjadi langkah awal yang membanggakan bagi tim mahasiswa D3 Sistem Informasi.",
      "Tim membawa ide pengembangan perangkat lunak yang dirancang untuk menjawab kebutuhan nyata pengguna.",
      "HIMA D3 SI akan terus mendukung proses persiapan hingga tahap berikutnya.",
    ],
    date: "10 April 2026",
    readTime: "3 min",
    author: "Tim Media",
    category: "prestasi",
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1200&h=800&fit=crop",
    featured: false,
    unitName: "",
  },
]

export type UnitMember = {
  name: string
  role: string
  image: string | StaticImageData
}

export type WorkProgram = {
  name: string
  description: string
  status: "Rutin" | "Berjalan" | "Rencana"
}

export type WorkUnit = {
  slug: string
  type: "Departemen" | "Biro"
  name: string
  description: string
  logo: StaticImageData | string
  programs: string[]
  members: UnitMember[]
  workPrograms: WorkProgram[]
}

const portraitA = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=650&fit=crop"
const portraitB = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=650&fit=crop"
const portraitC = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&h=650&fit=crop"
const portraitD = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=650&fit=crop"

export const workUnits: WorkUnit[] = [
  {
    slug: "pendidikan",
    type: "Departemen",
    name: "Pendidikan",
    description: "Mengelola program pengembangan akademik, study club, dan pendampingan belajar mahasiswa.",
    logo: pendidikanLogo,
    programs: ["Study Club", "Tutor Sebaya", "Seminar Akademik"],
    members: [
      { name: "Andi Wijaya", role: "Kepala Departemen", image: portraitB },
      { name: "Nadia Putri", role: "Wakil Kepala Departemen", image: portraitA },
      { name: "Raka Pratama", role: "Staff", image: portraitD },
    ],
    workPrograms: [
      { name: "Study Club", description: "Kelas belajar mingguan untuk mata kuliah inti dan persiapan proyek.", status: "Rutin" },
      { name: "Tutor Sebaya", description: "Pendampingan belajar antarangkatan untuk membantu mahasiswa yang membutuhkan support akademik.", status: "Berjalan" },
      { name: "Seminar Akademik", description: "Forum materi dari dosen, alumni, dan praktisi untuk memperluas wawasan akademik.", status: "Rencana" },
    ],
  },
  {
    slug: "media-dan-komunikasi",
    type: "Departemen",
    name: "Media dan Komunikasi",
    description: "Mengelola publikasi, dokumentasi, kanal informasi, dan wajah digital HIMA D3 SI.",
    logo: medkomLogo,
    programs: ["Content Lab", "Dokumentasi Kegiatan", "Social Media Update"],
    members: [
      { name: "Reza Firmansyah", role: "Kepala Departemen", image: portraitD },
      { name: "Maya Indah", role: "Wakil Kepala Departemen", image: portraitC },
      { name: "Fathur Rahman", role: "Staff", image: portraitB },
    ],
    workPrograms: [
      { name: "Content Lab", description: "Produksi konten edukatif, campaign, dan publikasi kegiatan HIMA.", status: "Rutin" },
      { name: "Dokumentasi Kegiatan", description: "Mengarsipkan foto, video, dan narasi kegiatan organisasi.", status: "Berjalan" },
      { name: "Social Media Update", description: "Pengelolaan kalender konten dan insight media sosial.", status: "Rutin" },
    ],
  },
  {
    slug: "ekonomi-kreatif",
    type: "Departemen",
    name: "Ekonomi Kreatif",
    description: "Mengembangkan kreativitas, merchandise, campaign visual, dan peluang dana usaha organisasi.",
    logo: ekrafLogo,
    programs: ["Merchandise", "Creative Campaign", "Design Sprint"],
    members: [
      { name: "Lisa Kurnia", role: "Kepala Departemen", image: portraitA },
      { name: "Galih Pratama", role: "Staff", image: portraitB },
      { name: "Citra Aulia", role: "Staff", image: portraitC },
    ],
    workPrograms: [
      { name: "Merchandise", description: "Produksi dan penjualan merchandise resmi HIMA D3 SI.", status: "Berjalan" },
      { name: "Creative Campaign", description: "Campaign visual untuk kegiatan, hari besar, dan branding kabinet.", status: "Rutin" },
      { name: "Design Sprint", description: "Sesi eksplorasi desain untuk kebutuhan identitas visual organisasi.", status: "Rencana" },
    ],
  },
  {
    slug: "pengembangan-sumber-daya-manusia",
    type: "Departemen",
    name: "Pengembangan Sumber Daya Manusia",
    description: "Mengembangkan kapasitas anggota, kaderisasi, dan budaya organisasi yang sehat.",
    logo: psdmLogo,
    programs: ["Kaderisasi", "Upgrading", "Evaluasi Kabinet"],
    members: [
      { name: "Dewi Sartika", role: "Kepala Departemen", image: portraitC },
      { name: "Fajar Nugroho", role: "Wakil Kepala Departemen", image: portraitD },
      { name: "Hana Pertiwi", role: "Staff", image: portraitA },
    ],
    workPrograms: [
      { name: "Kaderisasi", description: "Program pembinaan anggota untuk memahami nilai, ritme kerja, dan tanggung jawab organisasi.", status: "Berjalan" },
      { name: "Upgrading", description: "Pelatihan skill organisasi, komunikasi, dan kepemimpinan untuk pengurus.", status: "Rutin" },
      { name: "Evaluasi Kabinet", description: "Forum refleksi dan perbaikan berkala untuk menjaga performa kabinet.", status: "Rutin" },
    ],
  },
  {
    slug: "sosial-politik",
    type: "Biro",
    name: "Sosial Politik",
    description: "Mengawal isu kemahasiswaan, advokasi, dan ruang diskusi sosial politik mahasiswa.",
    logo: sospolLogo,
    programs: ["Kajian Isu", "Advokasi Mahasiswa", "Forum Aspirasi"],
    members: [
      { name: "Rangga Saputra", role: "Kepala Biro", image: portraitB },
      { name: "Salsa Nabila", role: "Wakil Kepala Biro", image: portraitA },
      { name: "Irfan Maulana", role: "Staff", image: portraitD },
    ],
    workPrograms: [
      { name: "Kajian Isu", description: "Diskusi dan publikasi isu yang relevan dengan mahasiswa dan lingkungan kampus.", status: "Rutin" },
      { name: "Advokasi Mahasiswa", description: "Mewadahi aspirasi dan membantu komunikasi kebutuhan mahasiswa.", status: "Berjalan" },
      { name: "Forum Aspirasi", description: "Ruang dialog antara mahasiswa, HIMA, dan pihak terkait.", status: "Rencana" },
    ],
  },
  {
    slug: "hubungan-mahasiswa",
    type: "Biro",
    name: "Hubungan Mahasiswa",
    description: "Menjaga relasi internal, komunikasi antarangkatan, dan kedekatan HIMA dengan mahasiswa.",
    logo: humsiwaLogo,
    programs: ["Gathering", "Database Mahasiswa", "Sambang Angkatan"],
    members: [
      { name: "Alya Maheswari", role: "Kepala Biro", image: portraitA },
      { name: "Dimas Putra", role: "Wakil Kepala Biro", image: portraitB },
      { name: "Rani Permata", role: "Staff", image: portraitC },
    ],
    workPrograms: [
      { name: "Gathering", description: "Kegiatan kebersamaan untuk memperkuat hubungan antaranggota dan mahasiswa.", status: "Berjalan" },
      { name: "Database Mahasiswa", description: "Pendataan kebutuhan komunikasi dan relasi mahasiswa D3 SI.", status: "Rutin" },
      { name: "Sambang Angkatan", description: "Kunjungan dan dialog santai dengan tiap angkatan.", status: "Rencana" },
    ],
  },
]

export const cabinetLeads = [
  {
    group: "Ketua Umum",
    people: [
      {
        name: "Sakhaa Sayyidah Kurniawan",
        position: "Ketua Umum",
        description:
          "Mengawal arah gerak kabinet, menjaga visi organisasi, serta memastikan setiap program kerja berjalan selaras dengan kebutuhan mahasiswa.",
        image: ketuaLead,
      },
    ],
  },
  {
    group: "Wakil Ketua",
    people: [
      {
        name: "Latanza Akbar Fadilah",
        position: "Wakil Ketua",
        description:
          "Mendampingi ketua umum dalam menjaga ritme kerja kabinet, memperkuat koordinasi internal, serta memastikan setiap departemen dan biro bergerak terarah.",
        image: wakilLead,
      },
    ],
  },
]
