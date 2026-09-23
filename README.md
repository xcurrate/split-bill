# Split Bill App 💰

Aplikasi pembagian tagihan dengan multi-payer, split per item, dan kalkulasi otomatis. Built with Next.js App Router + TypeScript + Tailwind CSS.

## Features ✨

- **Multi-Payer**: Satu transaksi dapat dibayar oleh beberapa member dengan nominal masing-masing
- **Split per Item**: Bagi setiap item ke member tertentu (bisa shared)
- **Diskon Proporsional**: Alokasi diskon otomatis berdasarkan subtotal
- **Settlement Minimal**: Algoritma optimasi untuk meminimalkan jumlah transfer
- **Share**: Copy ringkasan ke clipboard
- **Local Storage**: Data tersimpan di browser
- **Mobile-First**: Optimized untuk penggunaan mobile

## Tech Stack 🛠

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Vitest (unit testing)

## Getting Started 🚀

### 1. Install Dependencies

```bash
cd split-bill-app
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 3. Build for Production

```bash
npm run build
```

Output akan ada di folder `dist/`.

### 4. Run Unit Tests

```bash
npm test
```

## Cara Penggunaan 📱

### 1. Buat Grup
- Klik "Grup Baru"
- Masukkan nama grup (contoh: "Makan Malam Bersama")

### 2. Tambah Member
- Masuk ke tab "Member"
- Klik "Member" untuk menambah anggota grup

### 3. Tambah Transaksi
- Masuk ke tab "Transaksi"
- Klik "Transaksi" untuk menambah transaksi baru
- Isi:
  - Nama transaksi (contoh: "Restoran Padang")
  - Pilih satu atau beberapa member yang membayar, kemudian isi nominal pembayaran masing-masing
  - Tambah item dengan harga dan quantity
  - Pilih member yang ikut patungan per item
  - Tambah diskon (jika ada)
  - Masukkan pajak & service charge (jika ada)
  - Pastikan **Total dibayar** sama dengan total transaksi. Tombol simpan akan dinonaktifkan bila ada selisih agar saldo settlement tetap konsisten.

### Kasus pembayaran bersama
Contoh tagihan Rp100.000 dibayar Alice Rp60.000 dan Bob Rp40.000. Centang Alice dan Bob pada bagian **Yang Membayar**, lalu masukkan nominal tersebut. Sistem akan mencatat pembayaran keduanya, bukan mengkreditkan seluruh Rp100.000 ke satu orang. Transaksi lama yang hanya memiliki satu pembayar tetap didukung.

### 4. Lihat Settlement
- Masuk ke tab "Settlement"
- Lihat berapa yang harus dibayar/diterima setiap member
- Lihat daftar transfer optimal (siapa bayar ke siapa)

### 5. Share
- Klik tombol "Share" di header grup
- Ringkasan akan disalin ke clipboard

## Algoritma Settlement 🧮

Aplikasi menggunakan greedy algorithm untuk meminimalkan jumlah transfer:

1. Hitung net balance tiap member: `paid - owes`
2. Pisahkan creditors (balance positif) dan debtors (balance negatif)
3. Match debtors dengan creditors secara greedy
4. Hasil: daftar transfer paling efisien

Contoh:
- Alice: +50rb (harus terima)
- Bob: -30kb (harus bayar)
- Charlie: -20kb (harus bayar)

Settlement optimal:
- Bob → Alice: 30rb
- Charlie → Alice: 20kb

(2 transfer, tidak perlu Bob→Charlie→Alice)

## Struktur Folder 📁

```
split-bill-app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── GroupList.tsx       # List grup
│   ├── GroupDetail.tsx     # Detail grup dengan tabs
│   ├── TransactionForm.tsx # Form transaksi
│   └── SettlementView.tsx  # Tampilan settlement
├── hooks/
│   ├── useLocalStorage.ts  # Hook localStorage
│   └── useGroups.ts        # Hook group management
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utility functions
│   ├── calculations.ts     # Kalkulasi & settlement
│   └── calculations.test.ts # Unit tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vitest.config.ts
```

## Data Sample 📝

Aplikasi sudah include data sample:
- Grup: "🍜 Makan Malam Bersama"
- Member: Budi, Ani, Charlie
- 2 Transaksi dengan diskon dan pajak

Data tersimpan di localStorage dan akan persist antar sesi.

## License 📄

MIT License - feel free to use and modify!
