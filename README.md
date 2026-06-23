# CV Reformatter — Harvard/ATS Standard

Tool otomatis untuk memformat ulang CV ke standar Harvard/ATS. Upload PDF atau gambar CV, download hasil .docx siap edit.

---

## Setup Lokal

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env dari template
```bash
cp .env.example .env
```

### 3. Isi API Key Gemini
- Buka https://aistudio.google.com/apikey
- Buat API Key baru (gratis)
- Isi di file `.env`:
```
GEMINI_API_KEY=isi_api_key_kamu_disini
```

### 4. Jalankan secara lokal
```bash
npm run dev
```
Buka http://localhost:3000

---

## Deploy ke Vercel

### Cara Cepat (via Vercel CLI)
```bash
npm install -g vercel
vercel
```

### Cara Manual (via Dashboard)
1. Push project ini ke GitHub
2. Buka https://vercel.com/new
3. Import repository
4. Tambahkan Environment Variable:
   - Name: `GEMINI_API_KEY`
   - Value: API key Gemini kamu
5. Klik Deploy

### ⚠️ Catatan Penting tentang Vercel
- **Hobby Plan (gratis):** Serverless function timeout 10 detik. Untuk CV sederhana biasanya cukup, tapi bisa timeout untuk CV kompleks.
- **Pro Plan ($20/bulan):** Timeout hingga 60 detik, lebih stabil untuk produksi.
- Untuk deploy awal, coba dulu di Hobby Plan.

---

## Privasi & Data

- **File CV tidak pernah disimpan** di server — hanya diproses di memory.
- File dikirim ke **Google Gemini API** untuk diproses.
- Pada **free tier Gemini**, data mungkin digunakan Google untuk training model.
- Untuk klien korporat atau data sensitif, pertimbangkan upgrade ke **Gemini API berbayar** (data tidak digunakan untuk training).

---

## Kustomisasi

### Mengubah instruksi formatting CV
Edit system prompt di: `app/api/process-cv/route.js` → variabel `GEMINI_SYSTEM_PROMPT`

### Mengubah model Gemini
Di file yang sama, cari `gemini-1.5-flash` dan ganti dengan model lain:
- `gemini-1.5-flash` — Cepat, gratis, rekomendasikan untuk produksi
- `gemini-1.5-pro` — Lebih akurat, ada limit lebih ketat di free tier

### Mengubah tampilan
Edit: `app/globals.css` untuk warna dan font
