'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Html5QrcodeScanner: any;
  }
}

const SESSION_TIMEOUT = 15 * 60 * 1000;

export default function AdminPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [scanMode, setScanMode] = useState<'masuk' | 'keluar'>('masuk');
  const scanModeRef = useRef<'masuk' | 'keluar'>('masuk');
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- STATES FORM LOGIN ---
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');

  // --- LOGIC AUTH ---
  useEffect(() => {
    const username = localStorage.getItem('admin_user');
    const password = localStorage.getItem('admin_pass');
    if (username && password) {
      setAuth(btoa(`${username}:${password}`));
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUser && inputPass) {
      localStorage.setItem('admin_user', inputUser);
      localStorage.setItem('admin_pass', inputPass);
      setAuth(btoa(`${inputUser}:${inputPass}`));
      Swal.fire({
        title: 'Berhasil Masuk',
        text: 'Selamat bekerja, Admin!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire('Error', 'Harap isi semua field!', 'error');
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setTimeoutWarning(false);
    warningTimerRef.current = setTimeout(
      () => {
        setTimeoutWarning(true);
      },
      SESSION_TIMEOUT - 1 * 60 * 1000,
    );
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout(true);
    }, SESSION_TIMEOUT);
  };

  const handleLogout = async (isTimeout: boolean = false) => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_pass');
    setAuth(null);
    setTimeoutWarning(false);
    if (isTimeout) {
      await Swal.fire({ title: 'Session Expired', text: 'Sesi berakhir. Silakan login kembali.', icon: 'warning' });
    }
    router.push('/');
  };

  useEffect(() => {
    if (!auth) return;
    resetInactivityTimer();
    const handleActivity = () => resetInactivityTimer();
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode';
    script.onload = () => {
      if (window.Html5QrcodeScanner) {
        const scanner = new window.Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } });
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }
    };
    document.body.appendChild(script);
    return () => {
      if (scannerRef.current) scannerRef.current.clear().catch((err: any) => console.log(err));
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const statusEl = document.getElementById('statusScan');
    if (!statusEl) return;
    const label = scanMode === 'masuk' ? 'Sistem Siap Scan (Pintu Masuk)...' : 'Sistem Siap Scan (Pintu Keluar)...';
    statusEl.innerText = label;
  }, [auth, scanMode]);

  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  const setStatusBadge = (text: string, className: string) => {
    const statusEl = document.getElementById('statusScan');
    if (!statusEl) return;
    statusEl.innerText = text;
    statusEl.className = className;
  };

  function onScanSuccess(decodedText: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    const activeMode = scanModeRef.current;
    const modeLabel = activeMode === 'masuk' ? 'Pintu Masuk' : 'Pintu Keluar';
    setStatusBadge(`⏳ Memeriksa Data (${modeLabel})...`, 'badge bg-warning text-dark p-2 fs-6');
    const scannedOrderId = decodedText;
    fetch('/api/sxjxfx6x6x6x/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ qr_content: decodedText, mode: activeMode }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success) {
          const name = data?.data?.nama || '-';
          const phone = data?.data?.no_hp || '-';
          const statusMasuk = data?.data?.status_masuk === 'sudah' ? 'SUDAH' : 'BELUM';
          const hasCard = Boolean(data?.data?.kartu_misi);
          const action = data?.action || '';
          const titleMap: Record<string, string> = {
            masuk_pertama_ok: 'MASUK & KARTU MISI DIBERIKAN ✅',
            masuk_lagi: 'MASUK KEMBALI ✅',
            keluar: 'BERHASIL KELUAR ✅',
            konfirmasi_masuk_pertama: 'MASUK PERTAMA KALI',
            cek_kartu_misi: 'CEK KARTU MISI',
          };
          const title = titleMap[action] || (activeMode === 'masuk' ? 'BERHASIL MASUK ✅' : 'BERHASIL KELUAR ✅');

          const badgeHtml = `<div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap;"><span style="padding:4px 8px;border-radius:12px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;">Status: ${statusMasuk}</span><span style="padding:4px 8px;border-radius:12px;background:${hasCard ? '#dcfce7' : '#fee2e2'};color:${hasCard ? '#166534' : '#991b1b'};font-size:12px;font-weight:700;">Kartu Misi: ${hasCard ? 'SUDAH' : 'BELUM'}</span></div>`;

          // === PINTU MASUK: Pertama kali → konfirmasi kasih kartu misi ===
          if (action === 'konfirmasi_masuk_pertama') {
            const confirm = await Swal.fire({
              title: 'MASUK PERTAMA KALI',
              html: `<h3 style="color:#2ecc71">${name}</h3><p>No HP: <b>${phone}</b></p>${badgeHtml}<p style="font-size:15px;font-weight:bold;color:#059669;margin-top:12px">Sudah berikan kartu misi?</p>`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: '✅ SUDAH, MASUK',
              cancelButtonText: 'KEMBALI',
              confirmButtonColor: '#16a34a',
              cancelButtonColor: '#6b7280',
              background: '#f0fdf4'
            });
            if (confirm.isConfirmed) {
              const res = await fetch('/api/sxjxfx6x6x6x/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
                body: JSON.stringify({ qr_content: scannedOrderId, mode: 'masuk', confirm_masuk: 'pertama' })
              });
              const nextData = await res.json();
              if (nextData.success) {
                Swal.fire({ title: 'MASUK & KARTU MISI DIBERIKAN ✅', html: `<h3 style="color:#2ecc71">${name}</h3>`, icon: 'success', timer: 2500, showConfirmButton: false, background: '#f0fdf4' });
              } else {
                Swal.fire('DITOLAK! ❌', nextData.message, 'error');
              }
            }
            resetScanner();
            return;
          }

          // === PINTU MASUK: Re-entry → admin cek kartu misi ADA / TIDAK ===
          if (action === 'cek_kartu_misi') {
            const confirm = await Swal.fire({
              title: 'ADMIN CEK KARTU MISI',
              html: `<h3 style="color:#2ecc71">${name}</h3><p>No HP: <b>${phone}</b></p>${badgeHtml}<p style="font-size:16px;font-weight:bold;color:#d97706;margin-top:12px">Kartu Misi ADA atau TIDAK?</p>`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'ADA ✅',
              cancelButtonText: 'TIDAK ADA ❌',
              confirmButtonColor: '#16a34a',
              cancelButtonColor: '#dc2626',
              background: '#fffbeb'
            });
            if (confirm.isConfirmed) {
              const res = await fetch('/api/sxjxfx6x6x6x/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
                body: JSON.stringify({ qr_content: scannedOrderId, mode: 'masuk', confirm_masuk: 'ada_kartu' })
              });
              const nextData = await res.json();
              if (nextData.success) {
                Swal.fire({ title: 'MASUK KEMBALI ✅', html: `<h3 style="color:#2ecc71">${name}</h3><p>Peserta boleh masuk.</p>`, icon: 'success', timer: 2500, showConfirmButton: false, background: '#f0fdf4' });
              } else {
                Swal.fire('DITOLAK! ❌', nextData.message, 'error');
              }
            } else {
              Swal.fire({ title: 'DITOLAK! ❌', text: 'Tidak ada kartu misi. Peserta tidak boleh masuk.', icon: 'error', timer: 3000, showConfirmButton: false });
            }
            resetScanner();
            return;
          }

          // === PINTU KELUAR: otomatis keluar (action = 'keluar') ===
          Swal.fire({
            title,
            html: `<h3 style="color:#2ecc71">${name}</h3><p>No HP: <b>${phone}</b></p>${badgeHtml}`,
            icon: 'success',
            timer: 2500,
            showConfirmButton: false,
            background: '#f0fff4',
          }).then(() => resetScanner());
        } else {
          Swal.fire({
            title: 'DITOLAK! ❌',
            text: data.message,
            icon: 'error',
            timer: 3000,
            showConfirmButton: false,
            background: '#fff5f5',
          }).then(() => resetScanner());
        }
      })
      .catch(() => {
        Swal.fire('Error', 'Gagal koneksi ke server', 'warning');
        resetScanner();
      });
  }

  function onScanFailure(error: any) {}
  function resetScanner() {
    setIsProcessing(false);
    const label = scanMode === 'masuk' ? 'Sistem Siap Scan (Pintu Masuk)...' : 'Sistem Siap Scan (Pintu Keluar)...';
    setStatusBadge(label, 'badge bg-secondary p-2 fs-6');
  }

  async function syncToSheets() {
    if (!auth) return;
    const { value: proceed } = await Swal.fire({
      title: 'Sync ke Google Sheets?',
      text: 'Ini akan mengirim semua data tiket lunas ke Google Sheets',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sync!',
    });
    if (!proceed) return;
    try {
      const res = await fetch('/api/sxjxfx6x6x6x/sync-sheets', {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
      });
      const data = await res.json();
      if (data.success) Swal.fire('Sukses!', data.message, 'success');
      else Swal.fire('Error', data.message, 'error');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async function searchTicket() {
    if (!auth || !searchOrderId) return;
    try {
      const res = await fetch(`/api/sxjxfx6x6x6x/search-ticket/${searchOrderId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const data = await res.json();
      if (data.success) setSearchResult(data.data);
      else {
        Swal.fire('Tidak Ditemukan', data.message, 'error');
        setSearchResult(null);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async function handlePreviewCsv() {
    const input = document.getElementById('csvFile') as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) {
      Swal.fire('Pilih file CSV terlebih dahulu', '', 'warning');
      return;
    }
    const file = input.files[0];
    const text = await file.text();
    setCsvText(text);
    const res = await fetch('/api/sxjxfx6x6x6x/import-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ csv: text }),
    });
    const data = await res.json();
    if (data.success) setCsvPreview(data.preview);
    else {
      Swal.fire('Preview Gagal', data.message || 'Error', 'error');
      setCsvPreview(null);
    }
  }

  async function handleConfirmImport() {
    setIsImporting(true);
    const res = await fetch('/api/sxjxfx6x6x6x/import-offline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = await res.json();
    setIsImporting(false);
    if (data.success) {
      Swal.fire('Sukses!', `✅ Created: ${data.report.created}\n✏️ Updated: ${data.report.updated}`, 'success');
      setCsvPreview(null);
      (document.getElementById('csvFile') as HTMLInputElement).value = '';
    } else {
      Swal.fire('Import Gagal', data.message || 'Error', 'error');
    }
  }

  // --- RENDER FORM LOGIN (TIDAK DIUBAH) ---
  if (!auth) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#0f172a]">
        <Head>
          <title>Admin Login - Solo Japanese Festival</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        </Head>

        {/* Background Image Asset */}
        <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/NEWBG.png')" }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />

        <main className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
          {/* LEFT SIDE: Form */}
          <div className="w-full md:w-1/2 bg-white p-8 md:p-14 flex flex-col justify-center text-slate-900">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 bg-blue-600 rounded-full"></div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Admin Access</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900">
                Holla,
                <br />
                Welcome Back
              </h1>
              <p className="text-slate-400 text-sm">Please enter your credentials to manage events</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Username"
                  value={inputUser}
                  onChange={(e) => setInputUser(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Password"
                  value={inputPass}
                  onChange={(e) => setInputPass(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-xs">
                Sign In to Panel
              </button>
            </form>

            <div className="mt-10 text-[10px] text-slate-300 font-medium tracking-[0.1em] text-center uppercase">
              Presented by <span className="text-blue-600 font-bold">AWSM Event Organizer</span>
            </div>
          </div>

          {/* RIGHT SIDE: Visual Branding */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative p-12 flex-col items-center justify-center text-center">
            <div className="absolute top-10 left-10 w-24 h-8 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-20 right-10 w-32 h-10 bg-white/10 rounded-full blur-xl" />

            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 mx-auto border border-white/20 shadow-2xl">
                <img src="/assets/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
              </div>
              <h2 className="text-white text-2xl font-black uppercase tracking-[0.2em] mb-2">Secure Access</h2>
              <div className="w-12 h-1 bg-white/30 mx-auto mb-4 rounded-full"></div>
              <p className="text-blue-100 text-[10px] opacity-80 leading-relaxed max-w-[220px] mx-auto uppercase tracking-[0.2em] font-bold">
                Solo Japanese Festival <br /> 2026 Edition Admin
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Solo Japanese Festival #2</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <div className="relative text-white z-10 flex flex-col min-h-screen bg-slate-950 font-sans">
        {/* Background Accents (Subtle) */}
        <div className="fixed top-0 left-0 w-full h-[500px] bg-blue-900/20 blur-[100px] pointer-events-none" />

        {/* --- HEADER --- */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <i className="fas fa-shield-alt text-white text-sm"></i>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase text-white">Admin Panel</h1>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={syncToSheets}
                id="btnSync"
                className="flex-1 sm:flex-none items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/40 text-emerald-100 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 backdrop-blur-md"
              >
                <i className="fas fa-sync-alt mr-2"></i> Sync Sheets
              </button>
              <button
                onClick={() => handleLogout(false)}
                className="flex-1 sm:flex-none items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/30 text-red-200 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 backdrop-blur-md"
                title="Logout dari Admin Panel"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </button>
            </div>
          </div>
        </header>

        {/* --- SESSION TIMEOUT WARNING --- */}
        {timeoutWarning && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-50">
            <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-100 p-4 rounded-xl flex items-start gap-4 backdrop-blur-md animate-pulse">
              <div className="p-2 bg-yellow-500/20 rounded-full">
                <i className="fas fa-exclamation-triangle text-xl"></i>
              </div>
              <div className="flex-1">
                <strong className="block mb-1 text-yellow-400 uppercase tracking-wider text-xs">Perhatian!</strong>
                <p className="text-sm opacity-90">Sesi Anda akan berakhir dalam 1 menit karena tidak ada aktivitas.</p>
              </div>
              <button onClick={() => setTimeoutWarning(false)} className="text-yellow-200 hover:text-white transition p-2">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {/* --- MAIN CONTENT (GRID LAYOUT MODIFIED ORDER) --- */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUMN 2: QR SCANNER (Order 1 on Mobile, Order 2 on Large) */}
            <div className="order-1 lg:order-2 lg:col-span-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl sticky top-24">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                      <i className="fas fa-qrcode text-lg"></i>
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">Scan QR Code</h2>
                  </div>
                  <div className="animate-pulse w-2 h-2 rounded-full bg-green-500"></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setScanMode('masuk')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      scanMode === 'masuk'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-900/60 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Mode Pintu Masuk
                  </button>
                  <button
                    onClick={() => setScanMode('keluar')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      scanMode === 'keluar'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                        : 'bg-slate-900/60 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Mode Pintu Keluar
                  </button>
                </div>

                <div className="bg-black/40 p-2 rounded-xl border border-white/5 mb-4 shadow-inner">
                  <div id="reader" className="rounded-lg overflow-hidden w-full h-auto"></div>
                </div>

                <div className="text-center">
                  <span id="statusScan" className="inline-flex items-center gap-2 bg-slate-800 border border-slate-600 px-4 py-2 rounded-full text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span> Sistem Siap Scan...
                  </span>
                </div>
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:col-span-8 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <i className="fas fa-search text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">Cari & Download Tiket</h2>
                    <p className="text-[10px] text-slate-400 mt-1">Cek status pembayaran dan unduh tiket peserta.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <i className="fas fa-ticket-alt"></i>
                    </span>
                    <input
                      type="text"
                      id="searchOrderId"
                      placeholder="Masukkan Order ID (Contoh: SJF2-173...)"
                      value={searchOrderId}
                      onChange={(e) => setSearchOrderId(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                    />
                  </div>
                  <button onClick={searchTicket} className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-sm whitespace-nowrap">
                    <i className="fas fa-search mr-2"></i> Cari
                  </button>
                </div>

                {searchResult && (
                  <div className="mt-6 bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <i className="fas fa-check-circle"></i> Data Ditemukan
                      </span>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Nama Peserta</span>
                        <span className="font-bold text-white text-base">{searchResult.nama}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Status Pembayaran</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${searchResult.status_bayar === 'lunas' || searchResult.status_bayar === 'settlement' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          {searchResult.status_bayar}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-500 text-xs block mb-1">Email</span>
                        <span className="font-medium text-slate-300">{searchResult.email}</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-4 border-t border-slate-700 flex flex-wrap gap-3">
                      <a
                        href={`/api/ticket/download/${searchOrderId}`}
                        className="flex-1 bg-white text-slate-900 font-bold px-4 py-2.5 rounded-lg hover:bg-slate-100 transition text-xs text-center border border-white"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="fas fa-download mr-2"></i>Download PDF
                      </a>
                      <a
                        href={`/api/ticket/view/${searchOrderId}`}
                        className="flex-1 bg-transparent border border-slate-600 text-slate-300 font-bold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition text-xs text-center"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="fas fa-eye mr-2"></i>Preview
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* CSV IMPORT */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <i className="fas fa-file-upload text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">Import Data Offline</h2>
                    <p className="text-[10px] text-slate-400 mt-1">Upload file .CSV untuk bulk insert data tiket.</p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-5">
                  <p className="text-xs text-slate-400 mb-2 font-mono">Format Header CSV:</p>
                  <code className="block bg-black/40 text-purple-300 px-3 py-2 rounded border border-white/5 text-[10px] md:text-xs font-mono break-all">email,nama,jenis_kelamin,hp,kota,usia,sosmed_type,sosmed_username</code>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none file:bg-slate-700 file:text-white file:font-bold file:border-0 file:px-4 file:py-1.5 file:rounded-md file:mr-4 file:text-xs hover:file:bg-slate-600 transition"
                  />
                  <button id="btnPreviewCsv" onClick={handlePreviewCsv} className="bg-purple-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 text-sm whitespace-nowrap">
                    <i className="fas fa-table mr-2"></i> Preview
                  </button>
                </div>
              </div>
            </div>

            {/* FULL WIDTH: CSV PREVIEW */}
            {csvPreview && (
              <div className="order-3 lg:col-span-12 animate-fade-in-up">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                        <i className="fas fa-eye text-lg"></i>
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Preview Data Import</h2>
                        <span className="text-xs text-slate-400">Total: {csvPreview.length} Baris data</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmImport}
                        disabled={isImporting}
                        className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-green-500 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                      >
                        {isImporting ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i> Importing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2"></i> Confirm Import
                          </>
                        )}
                      </button>
                      <button onClick={() => setCsvPreview(null)} className="bg-slate-700 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-slate-600 transition-all text-xs border border-slate-600">
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-900">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 shadow-md">
                        <tr>
                          <th className="py-4 px-4 border-b border-slate-700 w-10">No</th>
                          <th className="py-4 px-4 border-b border-slate-700">Nama</th>
                          <th className="py-4 px-4 border-b border-slate-700">Email</th>
                          <th className="py-4 px-4 border-b border-slate-700">Jenis Kelamin</th>
                          <th className="py-4 px-4 border-b border-slate-700">HP</th>
                          <th className="py-4 px-4 border-b border-slate-700">Kota</th>
                          <th className="py-4 px-4 border-b border-slate-700">Usia</th>
                          <th className="py-4 px-4 border-b border-slate-700">Sosmed</th>
                          <th className="py-4 px-4 border-b border-slate-700 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {csvPreview.map((row: any, i: number) => (
                          <tr key={row.idx} className={`hover:bg-slate-800/50 transition-colors ${row.status !== 'valid' ? 'bg-red-900/10' : i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/30'}`}>
                            <td className="py-3 px-4 text-slate-500 font-mono">{row.idx}</td>
                            <td className="py-3 px-4 font-medium text-white">{row.nama || '-'}</td>
                            <td className="py-3 px-4 text-slate-300">{row.email || '-'}</td>
                            <td className="py-3 px-4 text-slate-400">{row.jenis_kelamin || '-'}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono">{row.no_hp || '-'}</td>
                            <td className="py-3 px-4 text-slate-400">{row.asal_kota || '-'}</td>
                            <td className="py-3 px-4 text-slate-400">{row.kategori_usia || '-'}</td>
                            <td className="py-3 px-4 text-slate-400">{row.sosmed_type ? `${row.sosmed_type}: ${row.sosmed_username}` : '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.status === 'valid' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* --- FOOTER --- */}
        <footer className="w-full bg-slate-950/80 backdrop-blur-md border-t border-white/5 mt-auto py-6">
          <div className="max-w-[1600px] mx-auto px-6 text-center">
            <div className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">© 2026 AWSM EVENTORGANIZER - ADMIN PANEL</div>
          </div>
        </footer>
      </div>
    </>
  );
}
