'use client';

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

declare global {
  interface Window {
    Html5QrcodeScanner: any;
  }
}

export default function AdminPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

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
    return <div className="container mt-5 text-center">Loading...</div>;
  }

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Gate Check-in</h4>
        <button onClick={syncToSheets} id="btnSync" className="btn btn-success btn-sm">
          Sync Google Sheets
        </button>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header bg-info text-white">
          🔍 Cari & Download Tiket Manual
        </div>
        <div className="card-body">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              id="searchOrderId"
              placeholder="Masukkan Order ID (Contoh: SJF2-173...)"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
            />
            <button
              className="btn btn-info text-white"
              type="button"
              onClick={searchTicket}
            >
              Cari Tiket
            </button>
          </div>

          {searchResult && (
            <div id="searchResult" className="alert alert-success">
              <strong>Ditemukan!</strong>
              <br />
              Nama: <span id="resNama">{searchResult.nama}</span>
              <br />
              Email: <span id="resEmail">{searchResult.email}</span>
              <br />
              Status: <span>{searchResult.status_bayar}</span>
              <div className="mt-2">
                <a
                  id="btnDownloadManual"
                  href={`/api/ticket/download/${searchOrderId}`}
                  className="btn btn-sm btn-dark"
                  target="_blank"
                  rel="noreferrer"
                >
                  ⬇️ Download PDF
                </a>
                <a
                  id="btnViewManual"
                  href={`/api/ticket/view/${searchOrderId}`}
                  className="btn btn-sm btn-outline-dark"
                  target="_blank"
                  rel="noreferrer"
                >
                  👁️ Preview
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow">
        <div id="reader"></div>
        <div className="card-body text-center bg-white text-dark">
          <small className="text-muted">Arahkan kamera ke QR Code Tiket</small>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p id="statusScan" className="badge bg-secondary p-2 fs-6">
          Sistem Siap Scan...
        </p>
      </div>

      <div className="card shadow mt-4">
        <div className="card-header bg-primary text-white">📥 Import Offline CSV</div>
        <div className="card-body">
          <p>Unggah file CSV berisi kolom: <code>email,nama,hp,kota,usia,sosmed_type,sosmed_username</code></p>
          <div className="d-flex gap-2">
            <input id="csvFile" type="file" accept=".csv" className="form-control" />
            <button id="btnPreviewCsv" className="btn btn-warning" onClick={handlePreviewCsv}>
              👁️ Preview
            </button>
          </div>
        </div>
      </div>

      {csvPreview && (
        <div className="card shadow mt-4 border-warning">
          <div className="card-header bg-warning text-dark">
            📋 Preview ({csvPreview.length} baris)
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>HP</th>
                    <th>Kota</th>
                    <th>Usia</th>
                    <th>Sosmed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row: any) => (
                    <tr key={row.idx} className={row.status === 'valid' ? '' : 'table-danger'}>
                      <td>{row.idx}</td>
                      <td>{row.nama || '-'}</td>
                      <td>{row.email || '-'}</td>
                      <td>{row.no_hp || '-'}</td>
                      <td>{row.asal_kota || '-'}</td>
                      <td>{row.kategori_usia || '-'}</td>
                      <td>{row.sosmed_type || '-'}</td>
                      <td><span className={`badge ${row.status === 'valid' ? 'bg-success' : 'bg-danger'}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-success" onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? '⏳ Importing...' : '✅ Confirm Import'}
              </button>
              <button className="btn btn-secondary" onClick={() => setCsvPreview(null)}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
