# chatbot-akademik-ti

Chatbot Akademik Prodi TI UIN Malang (RAG-Based)

📝 Deskripsi Proyek
Chatbot Akademik ini adalah sebuah proyek penelitian skripsi yang bertujuan untuk menyediakan asisten virtual berbasis website. Tujuannya adalah untuk mempermudah mahasiswa, dosen, dan calon mahasiswa dalam mengakses informasi seputar kegiatan akademik di Program Studi Teknik Informatika, UIN Maulana Malik Ibrahim Malang.

Untuk memberikan jawaban yang akurat dan kontekstual, chatbot ini mengimplementasikan metode Retrieval-Augmented Generation (RAG), yang memungkinkan model bahasa untuk mengambil informasi relevan dari basis pengetahuan internal sebelum menghasilkan jawaban.

📊 Status Proyek Saat Ini
Proyek ini masih dalam tahap pengembangan awal.

✅ Frontend (UI/UX): Desain antarmuka chatbot telah selesai dibuat menggunakan HTML, CSS, dan JavaScript.

⏳ Backend & RAG Pipeline: Tim sedang dalam proses pengembangan backend, termasuk API, proses scraping data, pembuatan indeks, dan implementasi pipeline RAG.

✨ Fitur
Berikut adalah daftar fitur yang sudah ada dan yang direncanakan:

Current:
x
 Antarmuka chatbot yang responsif dengan tema futuristik (ambient black & blue).

Planned:
 Backend API menggunakan Python (FastAPI/Flask).
 Proses scraping data dari website resmi prodi dan dokumen akademik.
 Preprocessing data teks dan pembuatan indeks vektor menggunakan FAISS.
 Implementasi RAG Pipeline (Retriever + Generator).
 Integrasi penuh antara frontend dan backend.
 Mekanisme evaluasi untuk mengukur akurasi jawaban dan kepuasan pengguna.

📂 Struktur Direktori
Struktur proyek diatur sebagai berikut untuk memisahkan antara frontend, backend, dan dokumentasi.

/chatbot-rag-uinmalang
├── 📁 frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── 📁 backend/      (Coming Soon)
├── 📁 docs/         (Berisi dokumentasi, catatan riset, dan laporan)
└── 📄 README.md


🚀 Instalasi & Setup (Demo Frontend)
Karena backend masih dalam pengembangan, saat ini Anda hanya dapat menjalankan demo antarmuka frontend.

Clone repository ini ke mesin lokal Anda:

```bash
git clone [https://github.com/username-anda/chatbot-rag-uinmalang.git](https://github.com/username-anda/chatbot-rag-uinmalang.git)
```

Masuk ke direktori proyek:

```bash
cd chatbot-rag
```

- Buka folder frontend dan jalankan file index.html di browser (Google Chrome, Firefox, dll).

Catatan: Instruksi untuk setup backend akan ditambahkan setelah pipeline RAG selesai dikembangkan.

🗺️ Roadmap Pengembangan
- Milestone 1: Desain dan Implementasi UI - Frontend.
-  Milestone 2: Pengembangan Backend API dan Data Scraper.
- Milestone 3: Implementasi RAG Pipeline (Preprocessing, Indexing, Retrieval, Generation).
- Milestone 4: Integrasi Frontend dengan Backend API.
- Milestone 5: Pengujian, Evaluasi Model, dan User Testing.
- Milestone 6: Finalisasi dan Penyusunan Laporan Skripsi.

📜 Lisensi
Proyek ini dilisensikan di bawah MIT License. Lihat file LICENSE untuk detail lebih lengkap.

🙏 Acknowledgements
Proyek ini merupakan bagian dari penelitian Skripsi oleh seorang mahasiswa Program Studi Teknik Informatika, Fakultas Sains dan Teknologi, Universitas Islam Negeri Maulana Malik Ibrahim Malang.