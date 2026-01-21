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

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 menit dalam milidetik

export default function AdminPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const username = localStorage.getItem('admin_user');
      const password = localStorage.getItem('admin_pass');

      if (username && password) {
        setAuth(btoa(`${username}:${password}`));
      } else {
        // Prompt for login
        const { value: result } = await Swal.fire({
          title: 'Admin Login',
          html: `
            <div class="mb-3">
              <label class="form-label">Username</label>
              <input id="swal-input-user" class="form-control" type="text" placeholder="Username">
            </div>
            <div>
              <label class="form-label">Password</label>
              <input id="swal-input-pass" class="form-control" type="password" placeholder="Password">
            </div>
          `,
          didOpen: () => {
            (document.getElementById('swal-input-user') as HTMLInputElement)?.focus();
          },
          showCancelButton: true,
          confirmButtonText: 'Login'
        });

        if (result) {
          const user = (document.getElementById('swal-input-user') as HTMLInputElement).value;
          const pass = (document.getElementById('swal-input-pass') as HTMLInputElement).value;
          localStorage.setItem('admin_user', user);
          localStorage.setItem('admin_pass', pass);
          setAuth(btoa(`${user}:${pass}`));
        }
      }
    };

    checkAuth();
  }, []);

  // Function to reset inactivity timeout
  const resetInactivityTimer = () => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setTimeoutWarning(false);

    // Set warning timer (14 menit - 1 menit sebelum logout)
    warningTimerRef.current = setTimeout(() => {
      setTimeoutWarning(true);
    }, SESSION_TIMEOUT - (1 * 60 * 1000));

    // Set logout timer (15 menit)
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout(true);
    }, SESSION_TIMEOUT);
  };

  // Function untuk logout
  const handleLogout = async (isTimeout: boolean = false) => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_pass');
    setAuth(null);
    setTimeoutWarning(false);

    if (isTimeout) {
      await Swal.fire({
        title: 'Session Expired',
        text: 'Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }

    router.push('/');
  };

  // Inactivity tracking
  useEffect(() => {
    if (!auth) return;

    resetInactivityTimer();

    // Track user activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [auth]);

  useEffect(() => {
    if (!auth) return;

    // Load html5-qrcode script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode';
    script.onload = () => {
      if (window.Html5QrcodeScanner) {
        const scanner = new window.Html5QrcodeScanner('reader', {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        });

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      }
    };
    document.body.appendChild(script);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: any) => {
          console.log('Scanner cleanup error:', err);
        });
      }
    };
  }, [auth]);

  function onScanSuccess(decodedText: string) {
    if (isProcessing) return;

    setIsProcessing(true);
    document.getElementById('statusScan')!.innerText = '⏳ Memeriksa Data...';
    document.getElementById('statusScan')!.className = 'badge bg-warning text-dark p-2 fs-6';

    fetch('/api/sxjxfx6x6x6x/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({ qr_content: decodedText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire({
            title: 'BERHASIL MASUK! ✅',
            html: `
              <h3 style="color:#2ecc71">${data.data.nama}</h3>
              <p>No HP: <b>${data.data.no_hp}</b></p>
              <hr>
              <small>Silakan masuk venue.</small>
            `,
            icon: 'success',
            timer: 2500,
            showConfirmButton: false,
            background: '#f0fff4'
          }).then(() => {
            resetScanner();
          });
        } else {
          Swal.fire({
            title: 'DITOLAK! ❌',
            text: data.message,
            icon: 'error',
            timer: 3000,
            showConfirmButton: false,
            background: '#fff5f5'
          }).then(() => {
            resetScanner();
          });
        }
      })
      .catch(err => {
        Swal.fire('Error', 'Gagal koneksi ke server', 'warning');
        resetScanner();
      });
  }

  function onScanFailure(error: any) {
    // Handle scan failure
  }

  function resetScanner() {
    setIsProcessing(false);
    document.getElementById('statusScan')!.innerText = 'Sistem Siap Scan...';
    document.getElementById('statusScan')!.className = 'badge bg-secondary p-2 fs-6';
  }

  async function syncToSheets() {
    if (!auth) return;

    const { value: proceed } = await Swal.fire({
      title: 'Sync ke Google Sheets?',
      text: 'Ini akan mengirim semua data tiket lunas ke Google Sheets',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sync!'
    });

    if (!proceed) return;

    try {
      const res = await fetch('/api/sxjxfx6x6x6x/sync-sheets', {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` }
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire('Sukses!', data.message, 'success');
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async function searchTicket() {
    if (!auth || !searchOrderId) return;

    try {
      const res = await fetch(`/api/sxjxfx6x6x6x/search-ticket/${searchOrderId}`, {
        headers: { Authorization: `Basic ${auth}` }
      });

      const data = await res.json();

      if (data.success) {
        setSearchResult(data.data);
      } else {
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({ csv: text })
    });

    const data = await res.json();
    if (data.success) {
      setCsvPreview(data.preview);
    } else {
      Swal.fire('Preview Gagal', data.message || 'Error', 'error');
      setCsvPreview(null);
    }
  }

  async function handleConfirmImport() {
    setIsImporting(true);
    const res = await fetch('/api/sxjxfx6x6x6x/import-offline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({ csv: csvText })
    });

    const data = await res.json();
    setIsImporting(false);
    if (data.success) {
      Swal.fire('Sukses!', `✅ Created: ${data.report.created}\n✏️ Updated: ${data.report.updated}\n⏭️ Skipped: ${data.report.skipped}`, 'success');
      setCsvPreview(null);
      (document.getElementById('csvFile') as HTMLInputElement).value = '';
    } else {
      Swal.fire('Import Gagal', data.message || 'Error', 'error');
    }
  }

  if (!auth) {
    return <div className="relative min-h-screen text-white flex items-center justify-center z-10">
      <div className="text-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    </div>;
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Solo Japanese Festival #2</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <div className="relative text-white z-10 flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
          {/* --- HEADER --- */}
        <header className="flex justify-between items-center px-6 py-8 md:px-20 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase">Admin Panel</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={syncToSheets} 
              id="btnSync" 
              className="glass-panel px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[12px] md:text-sm font-bold hover:opacity-80 transition whitespace-nowrap"
            >
              Sync Sheets
            </button>
            <button 
              onClick={() => handleLogout(false)} 
              className="glass-panel px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[12px] md:text-sm font-bold hover:opacity-80 transition bg-red-500/30 border-red-500/50 whitespace-nowrap"
              title="Logout dari Admin Panel"
            >
              Logout
            </button>
          </div>
        </header>

        {/* --- SESSION TIMEOUT WARNING --- */}
        {timeoutWarning && (
          <div className="mx-6 md:mx-20 mt-4 glass-panel p-4 rounded-lg border-yellow-500/50 bg-yellow-500/15 backdrop-blur-[50px] border-yellow-400/50">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <strong className="block mb-1">Perhatian!</strong>
                <p className="text-[12px] md:text-sm opacity-90">
                  Sesi Anda akan berakhir dalam 1 menit karena tidak ada aktivitas. Silakan lakukan sesuatu untuk melanjutkan.
                </p>
              </div>
              <button 
                onClick={() => setTimeoutWarning(false)}
                className="text-xl opacity-60 hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 md:px-20 py-8 space-y-6">
          {/* SEARCH & DOWNLOAD TICKET */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl md:rounded-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <i className="fas fa-search text-lg md:text-xl"></i>
              <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.1em]">Cari & Download Tiket</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="text"
                id="searchOrderId"
                placeholder="Masukkan Order ID (Contoh: SJF2-173...)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="flex-1 bg-white/15 backdrop-blur-[50px] border border-white/50 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white transition text-[12px] md:text-sm"
              />
              <button
                onClick={searchTicket}
                className="bg-white text-blue-600 font-bold px-6 md:px-8 py-3 rounded-lg md:rounded-xl hover:bg-white/90 transition text-[12px] md:text-sm whitespace-nowrap"
              >
                Cari
              </button>
            </div>

            {searchResult && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mt-4">
                <div className="text-sm md:text-base space-y-2">
                  <div><strong>✅ Ditemukan!</strong></div>
                  <div>Nama: <span className="font-bold">{searchResult.nama}</span></div>
                  <div>Email: <span className="font-bold">{searchResult.email}</span></div>
                  <div>Status: <span className="font-bold">{searchResult.status_bayar}</span></div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <a
                      href={`/api/ticket/download/${searchOrderId}`}
                      className="bg-white text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition text-[12px] md:text-sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇️ Download PDF
                    </a>
                    <a
                      href={`/api/ticket/view/${searchOrderId}`}
                      className="glass-panel px-4 py-2 rounded-lg hover:opacity-80 transition text-[12px] md:text-sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR CODE SCANNER */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl md:rounded-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <i className="fas fa-qrcode text-lg md:text-xl"></i>
              <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.1em]">Scan QR Code</h2>
            </div>
            
            <div id="reader" className="rounded-xl overflow-hidden mb-4"></div>
            
            <div className="text-center">
              <p id="statusScan" className="inline-block bg-white/25 backdrop-blur-[50px] border border-white/50 px-4 py-2 rounded-lg text-[12px] md:text-sm font-bold">
                Sistem Siap Scan...
              </p>
            </div>
          </div>

          {/* CSV IMPORT */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl md:rounded-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <i className="fas fa-upload text-lg md:text-xl"></i>
              <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.1em]">Import Data Offline</h2>
            </div>
            
            <p className="text-[12px] md:text-sm opacity-80 mb-4">
              Format CSV: <code className="bg-white/15 backdrop-blur-[50px] px-2 py-1 rounded border border-white/50 text-[11px] md:text-xs">email,nama,jenis_kelamin,hp,kota,usia,sosmed_type,sosmed_username</code>
            </p>
            
            <div className="flex flex-col md:flex-row gap-2">
              <input 
                id="csvFile" 
                type="file" 
                accept=".csv" 
                className="flex-1 bg-white/15 backdrop-blur-[50px] border border-white/50 rounded-lg px-4 py-3 text-white placeholder-white/50 text-[12px] md:text-sm cursor-pointer file:bg-white file:text-gray-800 file:font-bold file:border-0 file:px-4 file:py-2 file:rounded file:mr-4"
              />
              <button 
                id="btnPreviewCsv" 
                onClick={handlePreviewCsv}
                className="bg-yellow-500 text-gray-900 font-bold px-6 md:px-8 py-3 rounded-lg hover:bg-yellow-400 transition text-[12px] md:text-sm whitespace-nowrap"
              >
                Preview
              </button>
            </div>
          </div>

          {/* CSV PREVIEW */}
          {csvPreview && (
            <div className="glass-panel p-6 md:p-8 rounded-2xl md:rounded-3xl border-yellow-500/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <i className="fas fa-table text-lg md:text-xl"></i>
                <h2 className="text-base md:text-lg font-bold uppercase tracking-[0.1em]">Preview ({csvPreview.length} baris)</h2>
              </div>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-[11px] md:text-sm">
                  <thead className="border-b border-white/20">
                    <tr>
                      <th className="text-left py-2 px-2 font-bold">No</th>
                      <th className="text-left py-2 px-2 font-bold">Nama</th>
                      <th className="text-left py-2 px-2 font-bold">Email</th>
                      <th className="text-left py-2 px-2 font-bold">Jenis Kelamin</th>
                      <th className="text-left py-2 px-2 font-bold">HP</th>
                      <th className="text-left py-2 px-2 font-bold">Kota</th>
                      <th className="text-left py-2 px-2 font-bold">Usia</th>
                      <th className="text-left py-2 px-2 font-bold">Sosmed</th>
                      <th className="text-left py-2 px-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row: any) => (
                      <tr 
                        key={row.idx} 
                        className={`border-b border-white/10 ${row.status === 'valid' ? '' : 'bg-red-500/10'}`}
                      >
                        <td className="py-2 px-2">{row.idx}</td>
                        <td className="py-2 px-2">{row.nama || '-'}</td>
                        <td className="py-2 px-2">{row.email || '-'}</td>
                        <td className="py-2 px-2">{row.jenis_kelamin || '-'}</td>
                        <td className="py-2 px-2">{row.no_hp || '-'}</td>
                        <td className="py-2 px-2">{row.asal_kota || '-'}</td>
                        <td className="py-2 px-2">{row.kategori_usia || '-'}</td>
                        <td className="py-2 px-2">{row.sosmed_type || '-'}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${row.status === 'valid' ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleConfirmImport} 
                  disabled={isImporting}
                  className="bg-green-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-400 transition text-[12px] md:text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {isImporting ? '⏳ Importing...' : '✅ Confirm Import'}
                </button>
                <button 
                  onClick={() => setCsvPreview(null)}
                  className="glass-panel px-6 py-3 rounded-lg hover:opacity-80 transition text-[12px] md:text-sm"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </main>

        {/* --- FOOTER --- */}
        <footer className="w-full bg-black/40 backdrop-blur-md border-t border-white/10 mt-auto pt-4">
          <div className="px-6 md:px-20 py-3 text-center">
            <div className="text-[8px] md:text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">© 2026 AWSM EVENTORGANIZER - ADMIN PANEL</div>
          </div>
        </footer>
      </div>
    </>
  );
}
