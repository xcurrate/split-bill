# Split Bill App - Instructions

## 🚀 Langkah Menjalankan Aplikasi

### Prerequisites
- Node.js 18+ (disarankan 20+)
- npm atau yarn

### 1. Install Dependencies

```bash
cd split-bill-app
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

### 3. Build Production

```bash
npm run build
```

Hasil build akan ada di folder `dist/`

### 4. Jalankan Unit Tests

```bash
npm test
```

---

## 📱 Cara Penggunaan Aplikasi

### Membuat Grup Baru
1. Klik tombol **"Grup Baru"**
2. Masukkan nama grup (contoh: "Makan Malam Bersama")
3. Klik **"Buat"**

### Menambah Member
1. Pilih grup yang sudah dibuat
2. Pindah ke tab **"Member"**
3. Klik tombol **"Member"**
4. Masukkan nama member
5. Klik **"Tambah"**

### Menambah Transaksi
1. Di dalam grup, pindah ke tab **"Transaksi"**
2. Klik tombol **"Transaksi"**
3. Isi detail transaksi:
   - **Nama**: Nama transaksi (contoh: "Restoran Padang")
   - **Yang Membayar**: Pilih member yang membayar
   - **Item**: Tambahkan item dengan:
     - Nama item
     - Harga
     - Quantity
     - Pilih member yang ikut patungan (bisa multiple)
   - **Diskon** (opsional): Tambahkan diskon dengan tipe:
     - Persentase (%)
     - Nominal (Rp)
     - Alokasi: Proporsional / Rata / Custom
   - **Pajak & Service Charge** (opsional)
4. Klik **"Simpan"**

### Melihat Settlement
1. Pindah ke tab **"Settlement"**
2. Lihat:
   - **Saldo per Member**: Berapa yang harus diterima/dibayar
   - **Settlement**: Daftar transfer optimal (siapa bayar ke siapa)

### Share Ringkasan
1. Di header grup, klik tombol **Share** (ikon share)
2. Ringkasan akan disalin ke clipboard
3. Paste ke chat grup WhatsApp/Telegram

---

## 🧮 Fitur Kalkulasi

### Multi-Payer
Setiap transaksi bisa dibayar oleh orang berbeda. Sistem akan menghitung:
- Berapa yang sudah dibayar setiap orang
- Berapa yang seharusnya dibayar setiap orang
- Net balance (positif = harus terima, negatif = harus bayar)

### Split per Item
- Setiap item bisa dibagi ke satu atau lebih member
- Bisa set quantity per member (contoh: item "Nasi" qty 3, Budi 2, Ani 1)
- Harga otomatis dibagi proporsional

### Diskon Proporsional (Default)
Diskon dibagi sesuai subtotal item masing-masing member:
- Member dengan item lebih mahal → diskon lebih besar
- Member dengan item lebih murah → diskon lebih kecil

### Settlement Minimal Transfer
Algoritma greedy untuk meminimalkan jumlah transfer:
- Contoh: Alice +50k, Bob -30k, Charlie -20k
- Hasil: Bob→Alice 30k, Charlie→Alice 20k (2 transfer)
- Bukan: Bob→Charlie 30k, Charlie→Alice 50k (2 transfer juga, tapi lebih rumit)

---

## 📝 Data Sample

Aplikasi sudah include data sample:
- **Grup**: "🍜 Makan Malam Bersama"
- **Member**: Budi, Ani, Charlie
- **Transaksi 1**: Restoran Padang
  - Rendang x2 (Budi & Ani)
  - Ayam Pop (Charlie)
  - Es Teh x3 (semua)
  - Nasi x3 (semua)
  - Diskon 10%
  - Pajak & Service Charge
- **Transaksi 2**: Kopi Kenangan (dibayar Ani)
  - Kopi Susu x2 (Budi & Ani)
  - Matcha Latte (Charlie)

Data tersimpan di localStorage browser.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Testing**: Vitest
- **State**: React Hooks + LocalStorage

---

## 📁 Struktur File

```
split-bill-app/
├── app/
│   ├── layout.tsx          # Root layout dengan metadata
│   ├── page.tsx            # Main page dengan GroupList/GroupDetail
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── ui/                 # shadcn/ui components (15+ komponen)
│   ├── GroupList.tsx       # Daftar grup
│   ├── GroupDetail.tsx     # Detail grup dengan 3 tabs
│   ├── TransactionForm.tsx # Form transaksi lengkap
│   └── SettlementView.tsx  # Tampilan settlement
├── hooks/
│   ├── useLocalStorage.ts  # Hook untuk localStorage
│   └── useGroups.ts        # Hook CRUD grup (dengan seed data)
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Helper functions
│   ├── calculations.ts     # Algoritma kalkulasi & settlement
│   └── calculations.test.ts # Unit tests (15+ test cases)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── next.config.js          # Next.js config (export static)
├── vitest.config.ts        # Vitest config
└── README.md               # Dokumentasi
```

---

## ✅ Unit Tests

Jalankan test dengan:
```bash
npm test
```

Test mencakup:
- Perhitungan item total
- Split item ke multiple members
- Alokasi diskon (proporsional, equal, custom)
- Kalkulasi transaksi lengkap
- Algoritma settlement
- Group calculation end-to-end

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Error: "Port 3000 already in use"
```bash
npm run dev -- --port 3001
```

### Build error
```bash
rm -rf .next dist
npm run build
```

---

Selamat menggunakan Split Bill App! 🎉
