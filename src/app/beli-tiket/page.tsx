'use client';

import React, { useState, useEffect } from 'react';

// Extend window type for Midtrans Snap
declare global {
  interface Window {
    snap?: any;
  }
}

// Mocking Next.js components for compatibility
const Link = ({ children, href, className, ...props }) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
);

export default function BeliTiketPage() {
  // --- STATE DATA ---
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    hp: '',
    jenis_kelamin: '',
    asal_kota: '',
    kategori_usia: '',
    sosmed_type: 'Instagram',
    sosmed_username: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'radio') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('Anda harus menyetujui Syarat & Ketentuan');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email,
          no_hp: formData.hp,
          jenis_kelamin: formData.jenis_kelamin,
          asal_kota: formData.asal_kota,
          kategori_usia: formData.kategori_usia,
          sosmed_type: formData.sosmed_type,
          sosmed_username: formData.sosmed_username,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal memproses');

      setOrderId(data.order_id);

      const script = document.createElement('script');
      // Use production or sandbox based on environment
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      script.src = isProduction 
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      script.onload = () => {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: () => {
              setTimeout(() => {
                setShowResult(true);
                setLoading(false);
              }, 3000);
            },
            onPending: () => {
              setLoading(false);
              alert('Pembayaran menunggu...');
            },
            onError: () => {
              setLoading(false);
              alert('Pembayaran gagal!');
            },
            onClose: () => {
              setLoading(false);
            },
          });
        }
      };
      document.body.appendChild(script);
    } catch (error) {
      alert(error.message || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  // --- STYLE ELEMENTS (HIGH CONTRAST) ---
  // Label: Hitam Pekat
  const labelStyle = 'block text-[11px] font-extrabold uppercase tracking-[0.1em] text-black mb-1 ml-1';
  
  // Input: Border Lebih Gelap (Gray-400), Teks Hitam, Placeholder Terbaca
  const inputStyle =
    'w-full bg-white border border-gray-400 rounded-xl px-5 py-3.5 text-black placeholder:text-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-sm text-sm font-bold';

  // --- HALAMAN SUKSES (RESULT) ---
  if (showResult) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 bg-white text-black">
        <div className="w-full max-w-xl p-10 text-center animate-in fade-in zoom-in duration-500 rounded-[30px] border-2 border-gray-200 shadow-2xl bg-gray-50">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-check text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black mb-3 text-black uppercase italic tracking-tighter">Pembayaran Berhasil!</h2>
          <p className="mb-8 text-gray-800 font-bold text-lg">Tiket digital Anda telah siap. Silakan cek email atau download di bawah.</p>

          <div className="w-full aspect-[4/3] mb-8 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg bg-white">
            <iframe src={`/api/ticket/view/${orderId}`} title="Tiket Preview" className="w-full h-full" />
          </div>

          <div className="flex flex-col gap-4 w-full items-center">
            <a href={`/api/ticket/download/${orderId}`} className="btn-payment no-underline flex items-center justify-center !max-w-full !w-full shadow-xl bg-black text-white hover:bg-gray-800 py-4 rounded-xl font-black tracking-widest text-lg">
              DOWNLOAD PDF TIKET
            </a>
            <button onClick={() => window.location.reload()} className="text-gray-600 hover:text-black transition-all text-sm font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
              BELI TIKET LAGI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- HALAMAN UTAMA (FORM) ---
  return (
    // BACKGROUND UTAMA: PUTIH BERSIH
    <div className="relative flex flex-col min-h-screen font-['Plus_Jakarta_Sans'] text-black bg-white">
      
      {/* Navigation */}
      <nav className="w-full p-6 md:p-10 md:px-20 z-30">
        <Link href="/" className="inline-flex items-center gap-3 text-black hover:opacity-70 transition-all no-underline group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-gray-200 border border-gray-300">
            <i className="fas fa-arrow-left text-xs"></i>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Kembali ke Beranda</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-10 px-6 md:px-20 pb-20 z-20 items-start">
        
        {/* Branding Section (Kiri) */}
        <div className="lg:col-span-5 text-center lg:text-left space-y-6 pt-5 md:pt-10">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
            {/* LOGO BLACK */}
            <img src="/assets/logoblack.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-600 leading-none uppercase tracking-widest">Registration</p>
              <p className="text-xs font-black text-black leading-tight uppercase tracking-widest">Solo Japanese Festival #2</p>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] text-black uppercase italic tracking-tighter">
            PESAN <br /> <span className="text-gray-400">TIKETMU</span>
          </h1>

          <p className="text-gray-800 text-sm md:text-base max-w-sm mx-auto lg:mx-0 font-bold leading-relaxed">
            Silakan isi data diri dengan benar. Tiket akan dikirimkan secara otomatis melalui email setelah pembayaran dikonfirmasi.
          </p>

          <div className="hidden lg:block pt-8">
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-100 border border-gray-300">
              <i className="fas fa-shield-alt text-gray-600"></i>
              <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider leading-tight">
                Proses pembayaran aman & <br />
                terverifikasi oleh Midtrans
              </p>
            </div>
          </div>
        </div>

        {/* Form Section (Kanan) */}
        <div className="lg:col-span-7 w-full flex justify-center lg:justify-end animate-in slide-in-from-bottom duration-700">
          {/* CONTAINER FORM: ABU-ABU KONTRAS (bg-gray-100) dengan BORDER TEGAS */}
          <div className="w-full max-w-[620px] p-8 md:p-12 rounded-[35px] relative border-2 border-gray-200 shadow-2xl bg-gray-100">
            
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter">Data Pemesan</h2>
              <div className="h-1.5 w-16 bg-black mt-2 mx-auto lg:mx-0 rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className={labelStyle}>Nama Lengkap</label>
                <input type="text" name="nama" required value={formData.nama} onChange={handleInputChange} className={inputStyle} placeholder="Nama sesuai tanda pengenal" />
              </div>

              <div className="space-y-3">
                <label className={labelStyle}>Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Laki-laki', 'Perempuan'].map((gender) => (
                    <label key={gender} className="cursor-pointer">
                      <input type="radio" name="jenis_kelamin" value={gender} required className="hidden" checked={formData.jenis_kelamin === gender} onChange={handleInputChange} />
                      <span
                        className={`flex items-center justify-center py-3 border-2 rounded-xl text-[11px] font-black transition-all shadow-sm
                          ${formData.jenis_kelamin === gender ? 'bg-black text-white border-black shadow-md scale-[1.02]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                      >
                        {gender}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className={labelStyle}>Email Aktif</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className={inputStyle} placeholder="alamat@email.com" />
                </div>
                <div className="space-y-1">
                  <label className={labelStyle}>No. WhatsApp</label>
                  <input type="text" name="hp" required value={formData.hp} onChange={handleInputChange} className={inputStyle} placeholder="081234567xxx" />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelStyle}>Asal Kota</label>
                <input type="text" name="asal_kota" required value={formData.asal_kota} onChange={handleInputChange} className={inputStyle} placeholder="Contoh: Surakarta" />
              </div>

              <div className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2 space-y-1">
                  <label className={labelStyle}>Sosmed</label>
                  <select name="sosmed_type" value={formData.sosmed_type} onChange={handleInputChange} className={`${inputStyle} appearance-none cursor-pointer font-black !px-3 text-center md:text-left`}>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">Tiktok</option>
                    <option value="Facebook">Facebook</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1">
                  <label className={labelStyle}>Username</label>
                  <input type="text" name="sosmed_username" required value={formData.sosmed_username} onChange={handleInputChange} className={`${inputStyle} !px-4`} placeholder="username tanpa @" />
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelStyle}>Kategori Usia</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['< 17', '17-24', '25-34', '> 35'].map((usia) => (
                    <label key={usia} className="cursor-pointer">
                      <input type="radio" name="kategori_usia" value={usia} required className="hidden" checked={formData.kategori_usia === usia} onChange={handleInputChange} />
                      <span
                        className={`flex items-center justify-center py-3 border-2 rounded-xl text-[11px] font-black transition-all shadow-sm
                          ${formData.kategori_usia === usia ? 'bg-black text-white border-black shadow-md scale-[1.02]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
                      >
                        {usia}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 flex-shrink-0 rounded-md border-2 border-gray-400 bg-white text-black focus:ring-black transition-all cursor-pointer"
                  />
                  <span className="text-[12px] font-bold leading-none text-gray-800 group-hover:text-black transition-colors">
                    Saya menyetujui{' '}
                    <button type="button" className="text-black font-black underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity" data-bs-toggle="modal" data-bs-target="#termsModal">
                      Syarat & Ketentuan
                    </button>{' '}
                    yang berlaku.
                  </span>
                </label>
              </div>

              {/* TOMBOL BAYAR: HITAM PEKAT, TEKS PUTIH */}
              <button
                type="submit"
                disabled={loading}
                className="btn-payment !max-w-full !w-full mt-4 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all bg-black text-white font-black py-4 rounded-xl tracking-widest border-2 border-transparent hover:border-gray-800"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-circle-notch animate-spin"></i> MEMPROSES...
                  </span>
                ) : (
                  'BAYAR SEKARANG'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Modal - Style Clean & Contrast */}
      <div className="modal fade px-4 z-[9999]" id="termsModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered mx-auto max-w-lg">
          <div className="modal-content bg-white border-2 border-gray-300 rounded-[30px] overflow-hidden shadow-2xl">
            <div className="modal-header border-none pt-10 px-10 pb-0 flex justify-between items-center text-black">
              <h5 className="modal-title font-black text-3xl uppercase italic tracking-tighter">Syarat dan Ketentuan</h5>
              <button type="button" className="btn-close scale-110" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body p-10 pt-6 text-sm text-gray-800 font-bold leading-relaxed max-h-[60vh] overflow-y-auto">
              <ol className="list-decimal space-y-4 pr-2 marker:font-black marker:text-black pl-4">
                <li>Mohon jaga tiket sebaik mungkin, karena tiket hanya akan dikirim melalui email satu kali.</li>
                <li>Email boleh digunakan untuk membeli tiket untuk nama orang yang berbeda.</li>
                <li>Pastikan data yang Anda masukkan pada form pemesanan sudah benar dan valid.</li>
                <li>Tiket yang sudah dibeli tidak dapat dikembalikan (Non-Refundable) dengan alasan apapun, kecuali acara dibatalkan oleh penyelenggara.</li>
                <li>Satu tiket berlaku untuk satu orang pengunjung.</li>
                <li>Jagalah kerahasiaan QR Code pada tiket Anda. Panitia tidak bertanggung jawab jika tiket sudah dipindai oleh orang lain.</li>
              </ol>
            </div>
            <div className="modal-footer border-none p-10 pt-0">
              <button type="button" className="w-full shadow-lg bg-black text-white font-black py-3 rounded-xl hover:bg-gray-800 transition-all border-2 border-black" data-bs-dismiss="modal">
                SAYA MENGERTI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}