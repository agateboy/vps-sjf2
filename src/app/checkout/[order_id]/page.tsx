'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

// Extend Window interface for Midtrans SNAP
declare global {
  interface Window {
    snap?: any;
  }
}

interface OrderData {
  id: number;
  order_id: string;
  nama: string;
  email: string;
  no_hp: string;
  jenis_kelamin: string;
  asal_kota: string;
  kategori_usia: string;
  sosmed_type: string;
  sosmed_username: string;
  status_bayar: string;
  status_tiket: string;
  createdAt: string;
  updatedAt: string;
  payment_method?: string;
  qris_image?: string;
  snap_token?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params.order_id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [snapReady, setSnapReady] = useState(false);
  const [paymentOpened, setPaymentOpened] = useState(false);
  const snapLoadedRef = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load Snap script once
  const loadSnapScript = useCallback(() => {
    if (snapLoadedRef.current || typeof window === 'undefined') return;
    if (document.querySelector('script[src*="midtrans"]')) {
      snapLoadedRef.current = true;
      setSnapReady(true);
      return;
    }
    const script = document.createElement('script');
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    script.onload = () => {
      snapLoadedRef.current = true;
      setSnapReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // Fetch order data
  const fetchOrder = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/checkout/${orderId}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Order tidak ditemukan');
        return;
      }
      setOrder(data.order);
      if (data.token) setSnapToken(data.token);
    } catch (err: any) {
      if (!silent) setError('Gagal memuat data: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    if (orderId) {
      fetchOrder();
      loadSnapScript();
    }
  }, [orderId, fetchOrder, loadSnapScript]);

  // Auto-poll status every 5s when pending
  useEffect(() => {
    if (order?.status_bayar === 'pending') {
      pollRef.current = setInterval(() => fetchOrder(true), 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [order?.status_bayar, fetchOrder]);

  // Open Snap payment
  const openPayment = () => {
    if (!snapToken || !window.snap) return;
    setPaymentOpened(true);
    window.snap.pay(snapToken, {
      onSuccess: () => {
        fetchOrder(false);
      },
      onPending: () => {
        // keep polling
      },
      onError: () => {
        alert('Pembayaran gagal. Silakan coba lagi.');
        setPaymentOpened(false);
      },
      onClose: () => {
        setPaymentOpened(false);
        fetchOrder(true);
      },
    });
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md text-center space-y-6 p-10 rounded-[30px] border-2 border-gray-200 shadow-2xl bg-gray-50">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter">Order Tidak Ditemukan</h2>
          <p className="text-gray-600 font-bold text-sm">{error || `Order ID: ${orderId}`}</p>
          <a href="/" className="inline-block bg-black text-white font-black px-8 py-3 rounded-xl hover:bg-gray-800 transition-all text-sm uppercase tracking-widest">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const isPending = order.status_bayar === 'pending';
  const isSettlement = order.status_bayar === 'settlement';
  const isFailed = order.status_bayar === 'failed';

  // --- SETTLEMENT: SUKSES ---
  if (isSettlement) {
    return (
      <div className="relative flex flex-col min-h-screen font-['Plus_Jakarta_Sans'] text-black bg-white">
        <nav className="w-full p-6 md:p-10 md:px-20 z-30">
          <a href="/" className="inline-flex items-center gap-3 text-black hover:opacity-70 transition-all no-underline group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-gray-200 border border-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Kembali ke Beranda</span>
          </a>
        </nav>

        <main className="flex-1 flex flex-col items-center px-6 md:px-20 pb-20">
          <div className="w-full max-w-[620px] space-y-6">
            {/* Success Header */}
            <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-black uppercase italic tracking-tighter">Pembayaran Berhasil!</h1>
              <p className="text-gray-600 font-bold text-sm">Tiket digital Anda telah siap. Cek email atau download di bawah.</p>
            </div>

            {/* Order Info Card */}
            <div className="p-6 md:p-8 rounded-[25px] border-2 border-gray-200 shadow-xl bg-gray-50 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
                  <p className="text-sm font-black text-black font-mono">{order.order_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nama</p>
                  <p className="text-sm font-black text-black">{order.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-700 break-all">{order.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">No. HP</p>
                  <p className="text-sm font-bold text-gray-700">{order.no_hp}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800 border border-green-200">
                    ✓ Lunas
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Preview */}
            <div className="rounded-[25px] border-2 border-gray-200 shadow-xl overflow-hidden bg-white">
              <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Preview Tiket</p>
              </div>
              <div className="aspect-[4/5] w-full">
                <iframe src={`/api/ticket/view/${order.order_id}`} title="Tiket Preview" className="w-full h-full border-0" />
              </div>
            </div>

            {/* Download Button */}
            <a
              href={`/api/ticket/download/${order.order_id}`}
              className="flex items-center justify-center gap-3 w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all shadow-xl text-sm uppercase tracking-widest no-underline"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              DOWNLOAD PDF TIKET
            </a>

            <a href="/beli-tiket" className="block text-center text-gray-600 hover:text-black transition-all text-sm font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
              BELI TIKET LAGI
            </a>
          </div>
        </main>
      </div>
    );
  }

  // --- PENDING / FAILED: CHECKOUT PAGE ---
  return (
    <div className="relative flex flex-col min-h-screen font-['Plus_Jakarta_Sans'] text-black bg-white">
      <nav className="w-full p-6 md:p-10 md:px-20 z-30">
        <a href="/" className="inline-flex items-center gap-3 text-black hover:opacity-70 transition-all no-underline group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-gray-200 border border-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Kembali ke Beranda</span>
        </a>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 md:px-20 pb-20">
        <div className="w-full max-w-[620px] space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/assets/logoblack.png" alt="Logo" className="w-12 h-12 object-contain" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-600 leading-none uppercase tracking-widest">Checkout</p>
                <p className="text-xs font-black text-black leading-tight uppercase tracking-widest">Solo Japanese Festival #2</p>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black uppercase italic tracking-tighter">
              {isFailed ? 'PEMBAYARAN GAGAL' : 'SELESAIKAN PEMBAYARAN'}
            </h1>
          </div>

          {/* Status Badge */}
          {isPending && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Menunggu Pembayaran</p>
                <p className="text-[11px] font-bold text-amber-700 mt-0.5">Klik tombol di bawah untuk membayar. Halaman ini aman di-refresh.</p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border-2 border-red-200">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div>
                <p className="text-xs font-black text-red-800 uppercase tracking-wider">Pembayaran Gagal / Expired</p>
                <p className="text-[11px] font-bold text-red-700 mt-0.5">Silakan buat pesanan baru untuk mencoba lagi.</p>
              </div>
            </div>
          )}

          {/* Order Details Card */}
          <div className="p-6 md:p-8 rounded-[25px] border-2 border-gray-200 shadow-xl bg-gray-50 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
                <p className="text-sm font-black text-black font-mono">{order.order_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nama</p>
                <p className="text-sm font-black text-black">{order.nama}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-bold text-gray-700 break-all">{order.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">No. HP</p>
                <p className="text-sm font-bold text-gray-700">{order.no_hp}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Jenis Kelamin</p>
                <p className="text-sm font-bold text-gray-700">{order.jenis_kelamin}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Asal Kota</p>
                <p className="text-sm font-bold text-gray-700">{order.asal_kota}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Usia</p>
                <p className="text-sm font-bold text-gray-700">{order.kategori_usia}</p>
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="p-6 md:p-8 rounded-[25px] border-2 border-gray-200 shadow-xl bg-gray-50 space-y-4">
            <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Informasi Pembayaran
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Tiket</span>
                <span className="text-base font-black text-black">Rp 50.000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    Menunggu
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                    Gagal
                  </span>
                )}
              </div>
              {order.payment_method && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metode</span>
                  <span className="text-sm font-black text-black uppercase">{order.payment_method}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Button */}
          {isPending && snapToken && (
            <button
              onClick={openPayment}
              disabled={!snapReady}
              className="w-full flex items-center justify-center gap-3 bg-black text-white font-black py-5 rounded-xl hover:bg-gray-800 transition-all shadow-xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {!snapReady ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  MEMUAT PEMBAYARAN...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  BAYAR SEKARANG
                </>
              )}
            </button>
          )}

          {isPending && (
            <button
              onClick={() => fetchOrder(false)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest border-2 border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              CEK STATUS PEMBAYARAN
            </button>
          )}

          {isFailed && (
            <a
              href="/beli-tiket"
              className="flex items-center justify-center gap-3 w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all shadow-xl text-sm uppercase tracking-widest no-underline"
            >
              BUAT PESANAN BARU
            </a>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-4 px-6 py-4 rounded-2xl bg-gray-100 border border-gray-300 mx-auto">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider leading-tight">
              Proses pembayaran aman &<br />terverifikasi oleh Midtrans
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
