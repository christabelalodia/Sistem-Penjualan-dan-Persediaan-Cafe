# Ruang Rasa

Web app sederhana untuk penjualan makanan/minuman ke cafe dan persediaan bahan baku.

## Struktur

- `frontend/` - HTML, CSS, dan JavaScript dashboard.
- `backend/app.js` - server Node.js tanpa dependency eksternal.
- `backend/schema.sql` - tiga tabel Supabase/Postgres dan data awal.

## Menjalankan

### Tanpa instalasi tambahan

Buka atau klik dua kali `frontend/index.html` menggunakan browser. Aplikasi berjalan dalam mode lokal dan menyimpan data di browser melalui `localStorage`. Pesanan, penerimaan bahan, produksi, dan perubahan stok tetap dapat diisi tanpa Node.js atau aplikasi server lain.

### Dengan Supabase

1. Jalankan seluruh `backend/schema.sql` di Supabase SQL Editor.
2. Atur environment variable pada terminal:
   - PowerShell: `$env:SUPABASE_URL="https://project-id.supabase.co"`
   - PowerShell: `$env:SUPABASE_ANON_KEY="your-anon-key"`
3. Pastikan Node.js 18+ tersedia, lalu jalankan `node backend/app.js` dari folder proyek.
4. Buka `http://localhost:3000`.

Model data sengaja dibatasi tiga entitas: `raw_materials`, `products`, dan `orders`. Resep produk serta detail item pesanan disimpan sebagai JSONB agar tetap sederhana.
