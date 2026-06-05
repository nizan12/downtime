**Down Time — Check Website Status**

Alat sederhana untuk memeriksa status dan waktu respons sebuah situs web. Masukkan URL, dan aplikasi akan menampilkan apakah situs aktif, kode status HTTP, dan waktu respon.

- **Demo (online):** https://downtimecheck.vercel.app/

**Fitur utama**
- **Cek URL sekali pakai:** Periksa status HTTP dan waktu respons.
- **Riwayat pemeriksaan:** Menyimpan (lokal/sesi) hasil pemeriksaan terbaru.
- **Antarmuka ringan:** Dibangun dengan Vite + React + TypeScript.

**Mulai cepat (lokal)**
- **Persyaratan:** Node.js (LTS) dan npm/yarn
- Install dependensi: `npm install`
- Jalankan development server: `npm run dev`

**Bangun & Jalankan produksi**
- Buat build: `npm run build`
- Jalankan preview: `npm run preview` atau deploy ke Vercel/Netlify

**Struktur penting**
- **Server/API:** lihat [server.ts](server.ts) dan [api/index.ts](api/index.ts)
- **Frontend:** sumber React ada di [src/](src/)

**Kontribusi**
- Bug report dan pull request dipersilakan. Mulai dengan membuat issue untuk mendiskusikan perubahan besar.

Lisensi: cek file lisensi repo jika ada.

File ini diperbarui agar menjelaskan fungsi dan cara menjalankan aplikasi "Down Time".
