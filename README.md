# Ruang Rasa

Web app sederhana untuk penjualan makanan/minuman ke cafe dan persediaan bahan baku.

Web Demo https://christabelalodia.github.io/Sistem-Penjualan-dan-Persediaan-Cafe/

## Menjalankan di komputer

Cara tercepat adalah membuka `frontend/index.html` di browser. Aplikasi langsung berjalan dalam mode lokal dan menyimpan data di browser/perangkat tersebut. Data mode lokal tidak otomatis dibagikan ke pengguna lain.

Untuk menjalankan melalui server lokal, pasang Node.js lalu dari folder proyek jalankan:

```powershell
node backend\app.js
```

Buka <http://localhost:3000>. Mode server ini memerlukan Supabase; atur `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sebagai environment variables sebelum menjalankan server.

## Menayangkan di GitHub Pages

1. Unggah seluruh proyek ke sebuah repository GitHub, termasuk folder `frontend/`, `backend/`, dan `.github/workflows/`.
2. Di repository, buka **Settings → Pages** dan ubah **Build and deployment → Source** menjadi **GitHub Actions**.
3. Push perubahan ke branch `main` (atau jalankan workflow **Deploy GitHub Pages** dari tab **Actions**). Workflow akan menerbitkan isi `frontend/` secara otomatis.
4. Setelah workflow berhasil, buka alamat GitHub Pages yang ditampilkan di **Settings → Pages**. Tampilan file di halaman repository GitHub memang berupa teks; buka alamat Pages untuk menggunakan aplikasinya.

GitHub Pages menjalankan aplikasi mode browser. Data dapat diisi dan disimpan di browser, tetapi tidak dibagikan antarperangkat sampai Supabase dikonfigurasi.

## Menggunakan Supabase untuk data bersama

1. Jalankan seluruh `backend/schema.sql` di Supabase SQL Editor untuk membuat tabel dan data contoh.
2. Buka aplikasi, pilih **Hubungkan Supabase**, lalu masukkan Project URL dan **anon/publishable key** dari **Project Settings → API**.
3. Simpan koneksi. Aplikasi akan menggunakan Supabase dari browser tersebut.

Jangan masukkan `service_role` atau secret key ke aplikasi browser ataupun repository. Kebijakan RLS pada skema contoh memberi akses umum ke tabel; kebijakan tersebut perlu diperketat sebelum aplikasi digunakan untuk data nyata. Jika koneksi ditolak, periksa kebijakan RLS dan izin tabel di Supabase.

## Struktur

- `frontend/` — HTML, CSS, JavaScript, dan aset aplikasi.
- `backend/app.js` — server Node.js tanpa dependency eksternal.
- `backend/schema.sql` — skema dan data awal Supabase/Postgres.
- `.github/workflows/deploy-pages.yml` — deployment otomatis ke GitHub Pages.
