'use client';

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

interface TimeLeft {
  d: string;
  h: string;
  m: string;
  s: string;
}

const eventData = {
  title: 'Solo Japanese Festival #2',
  description: 'Event seru di Lokananta Bloc, Surakarta',
  location: 'Lokananta Bloc, Surakarta',
  googleMapsUrl: 'https://maps.app.goo.gl/b3WvicDyt6PbqPV77',
  startTime: new Date('2026-02-16T19:00:00'),
  endTime: new Date('2026-02-16T22:00:00'),
};

const termsAndConditions = [
  'Mohon jaga tiket sebaik mungkin, karena tiket hanya akan dikirim melalui email satu kali.',
  'Email boleh digunakan untuk membeli tiket untuk nama orang yang berbeda.',
  'Pastikan data yang Anda masukkan pada form pemesanan sudah benar dan valid.',
  'Tiket yang sudah dibeli tidak dapat dikembalikan (Non-Refundable) dengan alasan apapun, kecuali acara dibatalkan oleh penyelenggara.',
  'Satu tiket berlaku untuk satu orang pengunjung.',
  'Jagalah kerahasiaan QR Code pada tiket Anda. Panitia tidak bertanggung jawab jika tiket sudah dipindai oleh orang lain.',
];

export default function LandingPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ d: '00', h: '00', m: '00', s: '00' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventDate = eventData.startTime.getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = eventDate - now;
      if (distance <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);
      setTimeLeft({
        d: String(days).padStart(2, '0'),
        h: String(hours).padStart(2, '0'),
        m: String(minutes).padStart(2, '0'),
        s: String(seconds).padStart(2, '0'),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const openGoogleMaps = () => {
    window.open(eventData.googleMapsUrl, '_blank');
  };

  const addToGoogleCalendar = () => {
    const start = eventData.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = eventData.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${start}/${end}&details=${encodeURIComponent(eventData.description)}&location=${encodeURIComponent(eventData.location)}`;
    window.open(url, '_blank');
    setDropdownOpen(false);
  };

  const addToICalendar = () => {
    const start = eventData.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = eventData.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent =
      `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AWSM Event Organizer//${eventData.title}//EN\nBEGIN:VEVENT\nUID:${new Date().getTime()}@awsmevent.com\nDTSTAMP:${start}Z\nDTSTART:${start}Z\nDTEND:${end}Z\nSUMMARY:${eventData.title}\nDESCRIPTION:${eventData.description}\nLOCATION:${eventData.location}\nEND:VEVENT\nEND:VCALENDAR`.trim();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventData.title.replace(/\s+/g, '_')}.ics`;
    link.click();
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  return (
    <>
      <Head>
        <title>Solo Japanese Festival #2</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <div className="relative min-h-screen text-white">
        <div className="fixed inset-0 bg-black/10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* --- HEADER --- */}
          <header className="flex justify-between items-center px-6 py-8 md:px-20">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div className="text-[9px] md:text-[10px] tracking-[0.2em] font-bold leading-tight uppercase">
                <span className="opacity-60">Presented By</span>
                <br />
                <span>AWSM Event Organizer</span>
              </div>
            </div>
            <a href="#" className="flex items-center gap-2 hover:opacity-80 transition text-white">
              <i className="fas fa-home text-sm"></i>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Beranda</span>
            </a>
          </header>

          <main className="flex-1 flex flex-col justify-center items-center md:items-start px-6 md:px-20 pb-20">
            {/* Logo Utama */}
            <div className="mb-6 md:mb-8 text-center md:text-left">
              <img src="/assets/Union.png" alt="Solo Japanese Festival #2" className="w-full max-w-[450px] md:max-w-[550px] drop-shadow-xl" />
            </div>

            {/* Bar Navigasi/Info */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 mb-6 md:mb-8 relative">
              <div className="relative" ref={dropdownRef}>
                <div className="glass-panel px-3 py-2 md:px-5 md:py-2 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <i className="far fa-calendar-alt text-[10px] md:text-sm"></i>
                  <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">15 Februari 2026</span>
                  <i className="fas fa-caret-down text-[10px] md:text-sm ml-1"></i>
                </div>
                {dropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 w-64 bg-white shadow-lg rounded-lg z-50 animate-fadeIn">
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-800 font-bold border-b transition" onClick={addToGoogleCalendar}>
                      Google Calendar
                    </button>
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-800 font-bold transition" onClick={addToICalendar}>
                      iCal / Outlook
                    </button>
                  </div>
                )}
              </div>

              <div className="glass-panel px-3 py-2 md:px-5 md:py-2 rounded-lg md:rounded-xl flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition" onClick={openGoogleMaps}>
                <i className="fas fa-map-marker-alt text-[10px] md:text-sm"></i>
                <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">Lokananta Bloc, Surakarta</span>
              </div>
            </div>

            {/* Timer Section */}
            <div className="glass-panel p-2 md:p-3 rounded-[15px] md:rounded-[20px] inline-flex w-fit mb-12">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="timer-box">{timeLeft.d[0]}</div>
                <div className="timer-box">{timeLeft.d[1]}</div>
                <span className="timer-sep mx-0.5">:</span>
                <div className="timer-box">{timeLeft.h[0]}</div>
                <div className="timer-box">{timeLeft.h[1]}</div>
                <span className="timer-sep mx-0.5">:</span>
                <div className="timer-box">{timeLeft.m[0]}</div>
                <div className="timer-box">{timeLeft.m[1]}</div>
                <span className="timer-sep mx-0.5">:</span>
                <div className="timer-box">{timeLeft.s[0]}</div>
                <div className="timer-box">{timeLeft.s[1]}</div>
              </div>
            </div>

            {/* --- WRAPPER UNTUK CTA & S&K --- */}
            <div className="w-full max-w-[550px] flex flex-col gap-y-10">
              {/* Box Beli Tiket */}
              <div className="cta-wrapper !w-full !max-w-none !m-0">
                <div className="cta-content">
                  <h2 className="cta-title">
                    Dapatkan Tiket
                    <br className="hidden md:block" />
                    <span> Presale Disini hanya IDR 40.000</span>
                  </h2>
                  <i className="fas fa-caret-right text-xl md:text-2xl hidden md:block"></i>
                </div>
                <button className="btn-payment" onClick={() => router.push('/')}>
                  21 Januari 2026
                </button>
              </div>

              {/* Box Syarat & Ketentuan */}
              <div className="glass-panel p-8 md:p-10 rounded-[30px] md:rounded-[40px] border border-white/20 animate-fadeIn w-full shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-8 border-b border-white/10 pb-6 text-center">
                  <i className="fas fa-clipboard-list text-white text-xl md:text-2xl"></i>
                  <h3 className="text-base md:text-lg font-bold uppercase tracking-[0.2em] text-white">Syarat & Ketentuan</h3>
                </div>
                <ul className="space-y-6">
                  {termsAndConditions.map((term, index) => (
                    <li key={index} className="flex items-start gap-4 text-white text-[12px] md:text-[14px] leading-relaxed group transition-all">
                      <span className="font-black text-white shrink-0 mt-1 text-[11px]">{String(index + 1).padStart(2, '0')}</span>
                      <span className="tracking-wide font-medium">{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </main>

          {/* --- FOOTER --- */}
          <footer className="w-full bg-black/40 backdrop-blur-md border-t border-white/10 mt-auto pt-4">
            <div className="max-w-[1440px] mx-auto px-6 py-3 md:px-20 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-x-6">
                <a href="https://www.instagram.com/solojapanesefestival" target="_blank" className="flex items-center gap-2 group">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-sm">
                    <i className="fab fa-instagram text-white text-[10px]"></i>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-white/90 group-hover:text-white transition-colors uppercase">@solojapanesefestival</span>
                </a>
                <a href="https://www.instagram.com/awsm.eventorganizer" target="_blank" className="flex items-center gap-2 group">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-sm">
                    <i className="fab fa-instagram text-white text-[10px]"></i>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-white/90 group-hover:text-white transition-colors uppercase">@awsm.eventorganizer</span>
                </a>
                <div className="hidden md:block w-[1px] h-3 bg-white/20"></div>
                <a href="https://wa.me/6285138452566" target="_blank" className="flex items-center gap-2 group">
                  <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm">
                    <i className="fab fa-whatsapp text-white text-[10px]"></i>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-white/90 group-hover:text-white transition-colors uppercase">CS EVENT</span>
                </a>
              </div>
              <div className="text-[8px] md:text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">© 2026 AWSM EVENTORGANIZER</div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
