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
  // --- STRUKTUR LOGIKA STATE: TETAP UTUH ---
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    hp: '',
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
      setFormData({ ...formData, kategori_usia: value });
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
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-XXXX');
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

  // --- REVISI WARNA UNTUK KONTRAS TINGGI ---
  const labelStyle = 'block text-[10px] font-extrabold uppercase tracking-[0.2em] text-white mb-2 ml-1 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]';
  const inputStyle =
    'w-full bg-black/30 backdrop-blur-md border-2 border-white/30 rounded-xl px-5 py-3.5 text-white placeholder:text-white/50 focus:outline-none focus:border-white focus:bg-black/50 transition-all shadow-inner text-sm font-bold';

  // Tampilan Setelah Berhasil Bayar
  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#5d94b8]">
        <div className="glass-panel max-w-xl w-full p-10 text-center animate-in fade-in zoom-in duration-500 rounded-[30px] border-white/40 shadow-2xl bg-black/20">
          <div className="mb-6 text-6xl drop-shadow-lg">✨</div>
          <h2 className="text-3xl font-black mb-3 text-white uppercase italic tracking-tighter drop-shadow-md">Pembayaran Berhasil!</h2>
          <p className="mb-8 text-white font-bold drop-shadow-sm">Tiket digital Anda telah siap. Silakan cek email atau download di bawah.</p>

          <div className="w-full aspect-[4/3] mb-8 rounded-2xl overflow-hidden border-2 border-white/30 bg-black/30 shadow-inner">
            <iframe src={`/api/ticket/view/${orderId}`} title="Tiket Preview" className="w-full h-full" />
          </div>

          <div className="flex flex-col gap-4 w-full items-center">
            <a href={`/api/ticket/download/${orderId}`} className="btn-payment no-underline flex items-center justify-center !max-w-full !w-full shadow-lg">
              DOWNLOAD PDF TIKET
            </a>
            <button onClick={() => window.location.reload()} className="text-white hover:opacity-80 transition-all text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
              BELI TIKET LAGI
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Navigation */}
      <nav className="w-full p-8 md:px-20 z-30">
        <Link href="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-all no-underline group">
          <div className="glass-panel w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-black/30 border-white/40 shadow-lg">
            <i className="fas fa-arrow-left text-xs"></i>
          </div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] drop-shadow-md">Kembali ke Beranda</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-10 px-6 md:px-20 pb-20 z-20 items-start">
        {/* Branding Section */}
        <div className="lg:col-span-5 text-center lg:text-left space-y-6 pt-10">
          <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
            <img src="/assets/logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-white/80 leading-none uppercase tracking-widest">Registration</p>
              <p className="text-xs font-black text-white leading-tight uppercase tracking-widest">Solo Japanese Festival #2</p>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.9] text-white uppercase italic tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            PESAN <br /> <span className="text-white/90">TIKETMU</span>
          </h1>

          <p className="text-white text-sm md:text-base max-w-sm mx-auto lg:mx-0 font-bold leading-relaxed drop-shadow-md">
            Silakan isi data diri dengan benar. Tiket akan dikirimkan secara otomatis melalui email setelah pembayaran dikonfirmasi.
          </p>

          <div className="hidden lg:block pt-8">
            <div className="glass-panel inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/20 border-white/30 shadow-xl">
              <i className="fas fa-info-circle text-white"></i>
              <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight">
                Proses pembayaran aman & <br />
                terverifikasi oleh Midtrans
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-7 w-full flex justify-center lg:justify-end animate-in slide-in-from-bottom duration-700">
          <div className="glass-panel w-full max-w-[620px] p-8 md:p-12 rounded-[35px] relative border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/10 backdrop-blur-3xl">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-sm">Data Pemesan</h2>
              <div className="h-1.5 w-16 bg-white mt-2 mx-auto lg:mx-0 rounded-full shadow-sm"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className={labelStyle}>Nama Lengkap</label>
                <input type="text" name="nama" required value={formData.nama} onChange={handleInputChange} className={inputStyle} placeholder="Nama sesuai tanda pengenal" />
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

              {/* REVISI SOSMED BERDAMPINGAN - OPTIMAL UNTUK MOBILE */}
              <div className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2 space-y-1">
                  <label className={labelStyle}>Sosmed</label>
                  <select name="sosmed_type" value={formData.sosmed_type} onChange={handleInputChange} className={`${inputStyle} appearance-none cursor-pointer font-black bg-[#5d94b8] !px-3 text-center md:text-left`}>
                    <option value="Instagram" className="bg-[#5d94b8] text-white">
                      Instagram
                    </option>
                    <option value="TikTok" className="bg-[#5d94b8] text-white">
                      Tiktok
                    </option>
                    <option value="Facebook" className="bg-[#5d94b8] text-white">
                      Facebook
                    </option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1">
                  <label className={labelStyle}>Username</label>
                  <input type="text" name="sosmed_username" required value={formData.sosmed_username} onChange={handleInputChange} className={`${inputStyle} !px-4`} placeholder="@username" />
                </div>
              </div>

              {/* FIX MUTLAK KATEGORI USIA */}
              <div className="space-y-3">
                <label className={labelStyle}>Kategori Usia</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['< 17', '17-24', '25-34', '> 35'].map((usia) => (
                    <label key={usia} className="cursor-pointer">
                      <input type="radio" name="kategori_usia" value={usia} required className="hidden" checked={formData.kategori_usia === usia} onChange={handleInputChange} />
                      <span
                        className={`flex items-center justify-center py-3 border-2 rounded-xl text-[11px] font-black transition-all shadow-sm hover:scale-[1.02]
                          ${formData.kategori_usia === usia ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/40 hover:bg-black/50'}`}
                      >
                        {usia}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PERBAIKAN CHECKBOX:items-center menggantikan items-start, mt-1 dihapus */}
              <div className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 flex-shrink-0 rounded-md border-2 border-white/50 bg-black/30 accent-white transition-all cursor-pointer"
                  />
                  <span className="text-[12px] font-bold leading-none text-white group-hover:text-white transition-colors drop-shadow-sm">
                    Saya menyetujui{' '}
                    <button type="button" className="text-white font-black underline decoration-2 underline-offset-4 hover:opacity-80 transition-opacity" data-bs-toggle="modal" data-bs-target="#termsModal">
                      Syarat & Ketentuan
                    </button>{' '}
                    yang berlaku.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-payment !max-w-full !w-full mt-4 flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
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

      {/* Modal - Kontras Tinggi */}
      <div className="modal fade px-4 z-[9999]" id="termsModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered mx-auto max-w-lg">
          <div className="modal-content !bg-[#5d94b8] border-2 border-white/50 rounded-[30px] overflow-hidden shadow-2xl">
            <div className="modal-header border-none pt-10 px-10 pb-0 flex justify-between items-center text-white">
              <h5 className="modal-title font-black text-3xl uppercase italic tracking-tighter">Aturan Main</h5>
              <button type="button" className="btn-close btn-close-white scale-110" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body p-10 pt-6 text-sm text-white font-bold leading-relaxed max-h-[60vh] overflow-y-auto">
              <ol className="list-decimal space-y-4 pr-2 marker:font-black marker:text-white">
                <li>Mohon jaga tiket sebaik mungkin, karena tiket hanya akan dikirim melalui email satu kali.</li>
                <li>Email boleh digunakan untuk membeli tiket untuk nama orang yang berbeda.</li>
                <li>Pastikan data yang Anda masukkan pada form pemesanan sudah benar dan valid.</li>
                <li>Tiket yang sudah dibeli tidak dapat dikembalikan (Non-Refundable) dengan alasan apapun, kecuali acara dibatalkan oleh penyelenggara.</li>
                <li>Satu tiket berlaku untuk satu orang pengunjung.</li>
                <li>Jagalah kerahasiaan QR Code pada tiket Anda. Panitia tidak bertanggung jawab jika tiket sudah dipindai oleh orang lain.</li>
              </ol>
            </div>
            <div className="modal-footer border-none p-10 pt-0">
              <button type="button" className="btn-payment !w-full !max-w-full shadow-lg" data-bs-dismiss="modal">
                SAYA MENGERTI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
