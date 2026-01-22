'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMidtransSnap, updateStatusFromMidtrans } from '@/lib/utils';

interface Order {
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
}

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params.order_id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  // Function to open SNAP payment popup manually
  const openPaymentPopup = () => {
    if (paymentToken && window.snap) {
      window.snap.pay(paymentToken, {
        onSuccess: () => {
          console.log('Payment success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onPending: () => {
          console.log('Payment pending');
        },
        onError: () => {
          console.log('Payment error');
          alert('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          console.log('User closed the popup');
        }
      });
    } else {
      // Load SNAP if not loaded
      const script = document.createElement('script');
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      script.src = isProduction 
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      script.async = true;
      
      script.onload = () => {
        if (window.snap && paymentToken) {
          window.snap.pay(paymentToken, {
            onSuccess: () => {
              console.log('Payment success');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            },
            onPending: () => {
              console.log('Payment pending');
            },
            onError: () => {
              console.log('Payment error');
              alert('Pembayaran gagal. Silakan coba lagi.');
            },
            onClose: () => {
              console.log('User closed the popup');
            }
          });
        }
      };
      
      document.body.appendChild(script);
    }
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/checkout/${orderId}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.message || 'Gagal memuat order');
          return;
        }
        
        setOrder(data.order);
        if (data.token) {
          setPaymentToken(data.token);
        }
      } catch (err: any) {
        setError('Terjadi kesalahan: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Initialize Midtrans SNAP when token is available and only on pending with button click
  // Popup sudah ditampilkan di halaman beli-tiket
  // Di halaman ini, hanya tampilkan button untuk buka popup jika diperlukan
  useEffect(() => {
    // Only for retry cases if user manually clicks open payment button
    // This effect is not used on initial load (popup sudah muncul di beli-tiket)
  }, [paymentToken, order?.status_bayar]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Loading...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Tidak Ditemukan</h1>
          <p className="text-gray-700 mb-6">Order ID: {orderId}</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const isPending = order.status_bayar === 'pending';
  const isSettlement = order.status_bayar === 'settlement';
  const isFailed = order.status_bayar === 'failed';

  // Show success screen for settlement
  if (isSettlement) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Pembayaran Berhasil!</h1>
            <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{order.order_id}</span></p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Peserta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="text-lg font-semibold text-gray-800">{order.nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-800">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No. HP</p>
                <p className="text-lg font-semibold text-gray-800">{order.no_hp}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jenis Kelamin</p>
                <p className="text-lg font-semibold text-gray-800">{order.jenis_kelamin}</p>
              </div>
            </div>
          </div>

          {/* QRIS Image if available */}
          {order.qris_image && order.payment_method === 'qris' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">QRIS Code - Bukti Pembayaran</h2>
              <div className="flex justify-center mb-4">
                <img 
                  src={order.qris_image} 
                  alt="QRIS Code" 
                  className="w-64 h-64 border-2 border-gray-300 rounded-lg p-2"
                />
              </div>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = order.qris_image!;
                  link.download = `QRIS-${order.order_id}.png`;
                  link.click();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Download QRIS
              </button>
            </div>
          )}

          {/* Ticket Download */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tiket Digital</h2>
            <p className="text-gray-600 mb-4">Tiket telah dikirim ke email Anda. Anda juga bisa download di bawah ini.</p>
            <a
              href={`/api/ticket/download/${order.order_id}`}
              className="block w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition text-center font-semibold"
            >
              Download PDF Tiket
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              ← Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
          <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{order.order_id}</span></p>
        </div>

        {/* Status Alert */}
        {isSettlement && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">Pembayaran Berhasil</p>
            <p className="text-green-700 text-sm mt-1">Terima kasih! Tiket Anda telah dikonfirmasi.</p>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Pembayaran Gagal</p>
            <p className="text-red-700 text-sm mt-1">Silakan coba lagi atau hubungi support.</p>
          </div>
        )}

        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-semibold">Menunggu Pembayaran</p>
            <p className="text-blue-700 text-sm mt-1">Silakan lengkapi pembayaran untuk mengkonfirmasi tiket Anda.</p>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Peserta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nama</p>
              <p className="text-lg font-semibold text-gray-800">{order.nama}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-800">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">No. HP</p>
              <p className="text-lg font-semibold text-gray-800">{order.no_hp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Jenis Kelamin</p>
              <p className="text-lg font-semibold text-gray-800">{order.jenis_kelamin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Asal Kota</p>
              <p className="text-lg font-semibold text-gray-800">{order.asal_kota}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kategori Usia</p>
              <p className="text-lg font-semibold text-gray-800">{order.kategori_usia}</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Pembayaran</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Harga Tiket</span>
              <span className="font-semibold text-gray-800">Rp 40.000</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold">
                {isPending && <span className="text-yellow-600">Pending</span>}
                {isSettlement && <span className="text-green-600">Settlement</span>}
                {isFailed && <span className="text-red-600">Failed</span>}
              </span>
            </div>
            {order.payment_method && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Metode Pembayaran</span>
                <span className="font-semibold text-gray-800">{order.payment_method}</span>
              </div>
            )}
          </div>
        </div>

        {/* QRIS Image if available */}
        {order.qris_image && order.payment_method === 'qris' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">QRIS Code</h2>
            <div className="flex justify-center">
              <img 
                src={order.qris_image} 
                alt="QRIS Code" 
                className="w-64 h-64 border-2 border-gray-300 rounded-lg p-2"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {isPending && (
            <>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Refresh Status
              </button>
              {paymentToken && (
                <button
                  onClick={openPaymentPopup}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Lanjut Pembayaran
                </button>
              )}
            </>
          )}
          <a
            href="/"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            ← Kembali
          </a>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for Midtrans SNAP
declare global {
  interface Window {
    snap?: any;
  }
}
