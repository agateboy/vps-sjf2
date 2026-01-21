'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSponsorLogoPath, getSponsorLogoPNG } from '@/lib/sponsors';

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
  googleMapsUrl: 'https://maps.app.goo.gl/p4qwyLTBp2ztmpSG6',
  startTime: new Date('2026-02-16T09:00:00'),
  endTime: new Date('2026-02-16T22:00:00'),
};

const activityCompetitions = [
  { name: 'MOBILE LEGEND COMPETITION', link: 'https://www.instagram.com/p/DTiCDimkhbA/?img_index=1' },
  { name: 'COSPLAY COMPETITION', link: 'https://www.instagram.com/solojapanesefestival/' },
  { name: 'COSWALK COMPETITION', link: 'https://www.instagram.com/solojapanesefestival/' },
  { name: 'BAND COMPETITION', link: 'https://www.instagram.com/p/DTiUbwAkrtd/?img_index=1' },
  { name: 'PHOTOGRAPHY COMPETITION', link: 'https://www.instagram.com/solojapanesefestival/' },
  { name: 'BEYBLADE COMPETITION', link: 'https://www.instagram.com/solojapanesefestival/' },
];

export default function LandingPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ d: '00', h: '00', m: '00', s: '00' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- FIX HYDRATION ERROR ---
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const targetDate = eventData.startTime.getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }
      setTimeLeft({
        d: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        h: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
        m: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, '0'),
        s: String(Math.floor((distance / 1000) % 60)).padStart(2, '0'),
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
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '#hero' },
    { name: 'Desa Shinobi', href: '#kartuID' },
    { name: 'Kartu Misi', href: '#aktivitas' },
    {
      name: 'Partner',
      dropdown: [
        { name: 'Partner Komunitas', href: '#partner' },
        { name: 'Media Partner ', href: '#media' },
      ],
    },
    { name: 'Lokasi', href: '#lokasi' },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      {/* Head removed: Gunakan Metadata API di layout.tsx jika butuh title/meta */}
      
      {/* --- HERO SECTION --- */}
      <section id="hero" className="hero-section relative w-full overflow-hidden bg-black">
        <div className="relative z-[100] flex flex-col min-h-screen text-white">
          <header className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 group/header ${isScrolled || isMenuOpen ? 'bg-black/95 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6 md:py-8'}`}>
            <div className="flex justify-between items-center px-5 md:px-20 max-w-[1440px] mx-auto w-full relative z-[1002]">
              {/* LOGO */}
              <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
                <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain transition-transform duration-500 group-hover/header:scale-110" />
                <div className="text-[9px] md:text-[10px] tracking-[0.2em] font-bold leading-tight uppercase">
                  <span className="opacity-60 block transition-all duration-500 group-hover/header:translate-x-1">Presented By</span>
                  <span className="block transition-all duration-500 group-hover/header:text-[#3b82f6] group-hover/header:tracking-[0.25em]">AWSM Event Organizer</span>
                </div>
              </div>

              {/* DESKTOP NAV */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link, index) => (
                  <div key={link.name} className="relative group/link" onMouseEnter={() => link.dropdown && setIsPartnerOpen(true)} onMouseLeave={() => link.dropdown && setIsPartnerOpen(false)}>
                    {/* PERBAIKAN: ClassName dibuat satu baris string & href diberi fallback */}
                    <a
                      href={link.href || '#'}
                      style={{
                        textDecoration: 'none',
                        transitionDelay: `${index * 40}ms`,
                      }}
                      className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-white transition-all duration-500 flex items-center gap-1 py-1 group-hover/header:translate-y-[-4px] group-hover/header:text-white/70 group-hover/link:!text-[#d7d9dd] group-hover/link:!translate-y-[-8px] group-hover/link:tracking-[0.3em]"
                    >
                      {link.name}
                      {link.dropdown && <i className={`fas fa-chevron-down text-[8px] transition-transform duration-300 ${isPartnerOpen ? 'rotate-180' : ''}`}></i>}
                    </a>

                    {link.dropdown && (
                      <div
                        className={`absolute left-0 mt-2 w-48 bg-black/95 backdrop-blur-md rounded-lg overflow-hidden transition-all duration-300 origin-top shadow-2xl border border-white/10 ${isPartnerOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 invisible'}`}
                      >
                        {link.dropdown.map((sub) => (
                          <a key={sub.name} href={sub.href} style={{ textDecoration: 'none' }} className="block px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#3b82f6] transition-all">
                            {sub.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* HAMBURGER BUTTON */}
              <button className="md:hidden flex flex-col justify-center items-center gap-1.5 z-[1003] relative w-8 h-8" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <span className={`w-6 h-0.5 bg-white transition-all duration-500 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-white transition-all duration-500 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-white transition-all duration-500 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </button>
            </div>

            {/* MOBILE MENU */}
            <div className={`fixed inset-0 h-screen bg-black/98 backdrop-blur-2xl z-[1001] flex flex-col items-end justify-center transition-all duration-500 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible translate-y-10'}`}>
              <nav className="flex flex-col items-center gap-6 w-full px-6 max-h-screen overflow-y-auto py-20">
                {navLinks.map((link) => (
                  <div key={link.name} className="text-center w-full group/mob">
                    {link.dropdown ? (
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold uppercase tracking-[0.15em] text-white/50 block py-1">{link.name}</span>
                        <div className="flex flex-col items-center gap-4 mt-2">
                          {link.dropdown.map((sub) => (
                            <a
                              key={sub.name}
                              href={sub.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-base font-bold uppercase tracking-[0.1em] text-white hover:text-[#3b82f6] transition-all"
                            >
                              {sub.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <a
                        href={link.href}
                        style={{ textDecoration: 'none' }}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-bold uppercase tracking-[0.15em] text-white block py-1 transition-all duration-300 group-hover/mob:tracking-[0.4em] group-hover/mob:text-[#3b82f6]"
                      >
                        {link.name}
                      </a>
                    )}
                    <div className="w-10 h-[1px] bg-white/20 mx-auto mt-6 group-last:hidden group-hover/mob:w-20 group-hover/mob:bg-[#3b82f6] transition-all duration-500" />
                  </div>
                ))}
              </nav>
            </div>
          </header>

          <main className="flex-1 flex flex-col justify-center items-center md:items-start px-5 md:px-20 pt-24 pb-24 w-full max-w-[1440px] mx-auto">
            <div className="mb-6 md:mb-8 text-center md:text-left w-full flex justify-center md:justify-start">
              <img src="/assets/Union.png" alt="Solo Japanese Festival #2" className="w-[80%] max-w-[300px] md:w-full md:max-w-[550px] drop-shadow-xl" />
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 mb-8 relative w-full">
              <div className="relative" ref={dropdownRef}>
                <div className="glass-panel px-3 py-2 md:px-5 md:py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-white/10 transition" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <i className="far fa-calendar-alt text-[10px] md:text-sm"></i>
                  <span className="font-bold text-[10px] md:text-sm">15 Februari 2026</span>
                </div>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white text-black rounded-lg shadow-xl overflow-hidden z-[200] text-sm font-bold border">
                    <button onClick={addToGoogleCalendar} className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b flex items-center gap-2">
                      <i className="fab fa-google text-red-600"></i> Google Calendar
                    </button>
                    <button onClick={addToICalendar} className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2">
                      <i className="fas fa-file-download text-blue-600"></i> Simpan File .ics
                    </button>
                  </div>
                )}
              </div>
              <div className="glass-panel px-3 py-2 md:px-5 md:py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-white/10 transition" onClick={openGoogleMaps}>
                <i className="fas fa-map-marker-alt text-[10px] md:text-sm"></i>
                <span className="font-bold text-[10px] md:text-sm">Lokananta Bloc, Surakarta</span>
              </div>
            </div>

            <div className="glass-panel p-2 md:p-3 rounded-xl inline-flex mb-10 transform scale-90 md:scale-100">
              <div className="flex items-center gap-1 md:gap-2">
                {isClient && (
                  <>
                    <div className="timer-box">{timeLeft.d[0]}</div>
                    <div className="timer-box">{timeLeft.d[1]}</div>
                    <span className="timer-sep">:</span>
                    <div className="timer-box">{timeLeft.h[0]}</div>
                    <div className="timer-box">{timeLeft.h[1]}</div>
                    <span className="timer-sep">:</span>
                    <div className="timer-box">{timeLeft.m[0]}</div>
                    <div className="timer-box">{timeLeft.m[1]}</div>
                    <span className="timer-sep">:</span>
                    <div className="timer-box">{timeLeft.s[0]}</div>
                    <div className="timer-box">{timeLeft.s[1]}</div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full max-w-[550px]">
              <div className="cta-wrapper flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="cta-title text-lg md:text-xl leading-tight">
                    Dapatkan Tiket <br className="hidden md:block" />
                    <span className="text-sm md:text-base font-normal">Presale IDR 40.000</span>
                  </h2>
                </div>
                <button className="btn-payment w-full md:w-auto" onClick={() => router.push('/')}>
                  Coming Soon!!!
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* --- SECTION DESA SHINOBHI --- */}
      <section
        id="kartuID"
        className="relative bg-white py-10 md:py-32 px-5 md:px-20 overflow-hidden"
        style={{
          marginTop: '-35px',
          borderTopLeftRadius: '35px',
          borderTopRightRadius: '35px',
          zIndex: 50,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12">
          <div className="w-full lg:w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex flex-col md:flex-row items-center relative w-full justify-center lg:justify-start">
              <h2 className="font-black tracking-tighter leading-none mb-0" style={{ color: '#5b7c4a', fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(45px, 12vw, 90px)' }}>
                DESA
              </h2>
              <div
                className="bg-[#b1362f] text-white px-3 py-2 md:py-3 md:px-7 md:min-h-[90px] w-fit rounded-md font-black tracking-widest uppercase lg:translate-y-[10px] shadow-lg flex items-center justify-center text-center mt-1 md:mt-0 ml-2 md:ml-5 transform scale-90 md:scale-100"
                style={{ fontSize: 'clamp(12px, 2vw, 18px)', lineHeight: '1.2' }}
              >
                DUNIA IMERSIF
              </div>
            </div>
            <h2 className="font-black tracking-tighter leading-none mb-3" style={{ color: '#5b7c4a', fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(45px, 12vw, 90px)' }}>
              SHINOBHI
            </h2>
            <p className="font-bold max-w-xl leading-snug px-2 md:px-0" style={{ color: '#333333', fontSize: 'clamp(14px, 3.5vw, 22px)' }}>
              Setiap Pengunjung Akan Mendapatkan Tiket <br className="hidden md:block" />
              <span className="opacity-70 block md:inline mt-1 md:mt-0" style={{ fontSize: 'clamp(12px, 3vw, 18px)' }}>
                "Kartu Identitas Warga Desa Shinobi"
              </span>
            </p>
          </div>
          <div className="w-full lg:w-[50%] flex justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="relative w-full max-w-[260px] md:max-w-[500px] lg:max-w-[550px]">
              <img src="/assets/Group 591.png" alt="Kartu Identitas" className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION KARTU MISI --- */}
      <section id="misi" className="misi-section min-h-[500px] md:min-h-[700px] flex items-center justify-center relative overflow-hidden py-10 md:py-16">
        <div className="w-full max-w-5xl px-[18%] md:px-20 lg:px-32 flex flex-col items-center md:items-start">
          <h2
            className="font-[900] uppercase mb-6 md:mb-12 tracking-tight text-center md:text-left w-full"
            style={{ color: '#b1362f', fontSize: 'clamp(16px, 4.5vw, 45px)', fontFamily: '"Arial Black", Gadget, sans-serif', lineHeight: '1.1' }}
          >
            KARTU MISI WARGA DESA SHINOBI
          </h2>

          <div className="flex flex-col-reverse md:flex-row items-center md:items-start gap-4 md:gap-12 w-full">
            <div className="flex flex-col gap-3 md:gap-4 w-full md:w-[280px] rounded-2xl shrink-0">
              <button
                onClick={() => {
                  const element = document.getElementById('aktivitas');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-white font-black py-2.5 md:py-4 px-4 rounded-2xl transition-all text-center uppercase shadow-lg active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: '#b1362f',
                  fontSize: 'clamp(10px, 2vw, 18px)',
                  boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                }}
              >
                CEK DAFTAR MISI
              </button>

              <button
                className="text-white font-black py-2.5 md:py-4 px-4 transition-all text-center uppercase shadow-lg active:scale-95"
                style={{
                  backgroundColor: '#5b7c4a',
                  fontSize: 'clamp(10px, 2vw, 18px)',
                  boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                }}
              >
                CEK DAFTAR DOORPRIZE
              </button>
            </div>

            <div className="w-full md:flex-1">
              <p className="font-bold leading-relaxed text-[#4a4a4a] text-left md:text-left mb-2 md:mb-0" style={{ fontSize: 'clamp(10px, 1.8vw, 19px)' }}>
                Jadilah Bagian Dari Keseruan Misi Warga Desa Shinobi Di Solo Japanese Festival #2 Heroes Comeback! Selesaikan Tantangannya, Kumpulkan Poinnya, Dan Bawa Pulang DoorPrize Dengan Total Hadiah Jutaan Rupiah!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION AKTIVITAS --- */}
      <section id="aktivitas" className=" bg-white py-16 md:py-24 px-5 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:w-[35%]">
            <div className="rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#5b7c4a' }}>
              <h2 className="text-center leading-none mb-1 tracking-tighter italic font-black" style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(35px, 5vw, 50px)' }}>
                AKTIVITAS
              </h2>
              <h3 className="text-center font-bold mb-6 opacity-90 tracking-widest uppercase whitespace-nowrap" style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(10px, 3.2vw, 18px)' }}>
                WARGA DESA SHINOBI
              </h3>
              <div className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-white/20">
                <div className="relative flex items-center justify-center group">
                  <img src="/assets/Group-496.png" alt="Kartu Misi" className="w-full h-auto drop-shadow-xl transform group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[#b1362f] font-black uppercase text-center leading-none" style={{ fontSize: 'clamp(14px, 3vw, 24px)', fontFamily: '"Arial Black", sans-serif', textShadow: '1px 1px 0px rgba(255,255,255,0.5)' }}>
                      KARTU MISI
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm md:text-base font-bold">Pengunjung Tidak Hanya Datang, Tapi Ikut Berpartisipasi Aktif Dalam Menjalankan Misi.</p>
            </div>
          </div>
          <div className="w-full lg:w-[65%] flex flex-col gap-3 md:gap-4">
            {activityCompetitions.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between text-white p-4 md:p-5 rounded-xl shadow-lg transition-all transform hover:translate-x-2 active:scale-95"
                style={{ backgroundColor: '#b1362f', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)', fontFamily: '"Arial Black", sans-serif' }}
              >
                <span className="text-sm md:text-xl font-black uppercase">{item.name}</span>
                <div className="bg-white text-[#b1362f] w-7 h-7 md:w-9 md:h-9 rounded-md flex items-center justify-center">
                  <i className="fas fa-play text-[10px] md:text-xs"></i>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION SPONSOR & PARTNERS --- */}
      <section id="sponsor" className="bg-white py-16 md:py-24 px-5 md:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative pt-6">
            <div className="absolute top-0 left-0 bg-[#b1362f] text-white px-6 py-1.5 rounded-t-lg text-[10px] md:text-xs font-bold uppercase z-10 shadow-sm">Presented By</div>
            <div className="bg-[#eeeeee] border border-gray-200 rounded-xl rounded-tl-none p-8 md:p-12 min-h-[160px] flex items-center justify-center">
              <div className="flex items-center gap-4 grayscale brightness-0 opacity-70">
                <img src="/assets/logo.png" alt="AWSM" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <div className="text-gray-700 leading-tight">
                  <span className="block font-black text-lg md:text-xl uppercase">AWSM</span>
                  <span className="text-xs md:text-sm font-bold opacity-60 uppercase">Event Organizer</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative pt-6">
            <div className="absolute top-0 left-0 bg-[#5b7c4a] text-white px-6 py-1.5 rounded-t-lg text-[10px] md:text-xs font-bold uppercase z-10 shadow-sm">Special Sponsor</div>
            <div className="bg-[#eeeeee] border border-gray-200 rounded-xl rounded-tl-none p-6 md:p-8 min-h-[160px]">
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const logoPath = getSponsorLogoPath('sponsors', i);
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-lg shadow-sm flex items-center justify-center p-2 aspect-square overflow-hidden group relative"
                    >
                      <img
                        src={logoPath}
                        alt={`sponsor-${i}`}
                        className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 bg-white/50">
                        <i className="fas fa-plus"></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION PARTNER KOMUNITAS --- */}
      <section id="partner" className="bg-white py-16 md:py-24 px-5 md:px-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-x-4 mb-8 text-center">
            <h2 className="font-black tracking-tighter" style={{ color: '#5b7c4a', fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(40px, 7vw, 72px)' }}>
              PARTNER
            </h2>
            <h2 className="font-black tracking-tighter" style={{ color: '#b1362f', fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(40px, 7vw, 72px)' }}>
              KOMUNITAS
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {isClient &&
              [...Array(10)].map((_, i) => {
                const logoPath = getSponsorLogoPath('komunitas', i + 1);
                return (
                  <div
                    key={i}
                    className="bg-[#f2f2f2] rounded-lg border-b-4 border-gray-300 flex items-center justify-center aspect-square text-gray-400 hover:bg-gray-100 hover:border-[#5b7c4a] hover:text-[#5b7c4a] transition-all active:scale-95 group cursor-pointer overflow-hidden relative"
                  >
                    <img
                      src={logoPath}
                      alt={`komunitas-${i + 1}`}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 rounded-lg flex items-center justify-center">
                      <i className="fas fa-plus text-3xl group-hover:scale-110 transition-transform"></i>
                    </div>
                  </div>
                );
              })}
            <a
              href="https://wa.me/6285138452566?text=Halo%20Admin,%20kami%20ingin%20mendaftarkan%20komunitas%20kami%20sebagai%20Partner%20di%20Solo%20Japanese%20Fest."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b1362f] rounded-lg border-b-4 border-[#8e2a24] flex items-center justify-center aspect-square shadow-md hover:brightness-110 active:scale-95 transition-all p-4 text-center cursor-pointer"
            >
              <span className="text-white font-black leading-none uppercase" style={{ fontSize: 'clamp(11px, 2vw, 16px)' }}>
                DAFTARKAN
                <br />
                KOMUNITASMU
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* --- SECTION TENANT FNB --- */}
      <section id="tenant" className="bg-white py-16 md:py-24 px-5 md:px-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <h2 className="font-black tracking-tighter text-center md:text-left" style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(28px, 4.2vw, 48px)' }}>
              <span style={{ color: '#5b7c4a' }}>PULUHAN</span> <span style={{ color: '#b1362f' }}>TENANT FNB</span> <span style={{ color: '#5b7c4a' }}>DAN</span>
              <br />
              <span style={{ color: '#b1362f' }}>MERCH</span> <span style={{ color: '#5b7c4a' }}>SIAP MEMANJAKANMU</span>
            </h2>
            <a
              href="https://wa.me/6285138452566?text=Halo%20Admin,%20saya%20tertarik%20mendaftar%20sebagai%20Tenant%20FNB/Merch%20di%20Solo%20Japanese%20Fest."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b1362f] text-white px-8 py-5 rounded-md shadow-lg hover:brightness-110 active:scale-95 transition-all text-center min-w-[300px] font-black uppercase text-[18px]"
            >
              KLIK UNTUK MENDAFTAR
              <br />
              <span className="text-sm">SLOT TERBATAS !</span>
            </a>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-3 md:gap-4">
            {isClient &&
              [...Array(20)].map((_, i) => {
                const logoPath = getSponsorLogoPath('fnb', i + 1);
                const logoPNG = getSponsorLogoPNG('fnb', i + 1);
                return (
                  <div
                    key={i}
                    className="bg-[#f8f8f8] rounded-md flex items-center justify-center aspect-square border border-gray-200 text-gray-400 hover:bg-gray-100 hover:border-[#5b7c4a] hover:text-[#5b7c4a] transition-all active:scale-90 group cursor-pointer overflow-hidden relative"
                  >
                    <picture>
                      <source srcSet={logoPath} type="image/webp" />
                      <img
                        src={logoPNG}
                        alt={`fnb-${i + 1}`}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    </picture>
                    <div className="hidden absolute inset-0 rounded-md flex items-center justify-center">
                      <i className="fas fa-plus text-xl md:text-2xl group-hover:rotate-90 transition-transform duration-300"></i>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* --- SECTION LOKASI ACARA --- */}
      <section id="lokasi" className="bg-white py-12 md:py-24 px-4 md:px-20 border-t border-gray-100 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[21/9] rounded-[25px] md:rounded-[50px] overflow-hidden shadow-2xl border-4 md:border-8 border-white group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: "url('/assets/Group-608.png')",
                backgroundPosition: 'center',
              }}
            ></div>
            <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            <div className="absolute left-3 top-3 md:left-10 md:top-10 z-20">
              <div className="bg-[#5b7c4a] p-3 md:p-8 rounded-xl md:rounded-2xl shadow-2xl flex flex-col gap-2 md:gap-5 border-b-4 border-black/20">
                <h2
                  className="text-white font-black leading-[0.85] uppercase"
                  style={{
                    fontSize: 'clamp(20px, 8vw, 70px)',
                    fontFamily: '"Arial Black", sans-serif',
                  }}
                >
                  LOKASI
                  <br />
                  ACARA
                </h2>
                <button
                  onClick={openGoogleMaps}
                  className="bg-[#b1362f] hover:bg-[#8e2a24] text-white px-3 py-2 md:px-6 md:py-3 rounded-md md:rounded-lg font-black text-[10px] md:text-sm flex items-center justify-between gap-2 shadow-lg transition-all active:scale-95 group/btn"
                >
                  BUKA DI GMAPS
                  <i className="fas fa-caret-right group-hover/btn:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>

            <div className="absolute right-4 bottom-8 md:right-[20%] md:top-[42%] md:bottom-auto flex items-center gap-2 md:gap-4 cursor-pointer group/pin" onClick={openGoogleMaps}>
              <div className="relative shrink-0">
                <div className="bg-[#b1362f] w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transform group-hover/pin:scale-110 transition-transform">
                  <i className="fas fa-map-marker-alt text-white text-sm md:text-2xl"></i>
                </div>
                <div className="absolute inset-0 bg-[#b1362f] rounded-full animate-ping opacity-20"></div>
              </div>

              <div className="bg-[#b1362f] text-white p-2.5 md:p-5 rounded-lg md:rounded-xl shadow-2xl border-b-4 border-black/20 max-w-[150px] md:max-w-[220px]">
                <p className="font-black text-[10px] md:text-xl leading-none mb-1 uppercase tracking-tight">LOKANANTA BLOC</p>
                <p className="text-[8px] md:text-[10px] opacity-90 leading-tight font-bold">Kerten, Kec. Laweyan, Kota Surakarta, Jawa Tengah 57143</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION DENAH --- */}
      <section id="denah" className="w-full relative bg-[#ffffff] pt-6 md:pt-20 pb-0">
        <div className="absolute top-20 left-10 z-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl hidden md:block">
          <h2 className="font-black text-black text-2xl">DENAH DESA SHINOBI</h2>
          <p className="text-xs text-gray-600 font-bold">SOLO JAPANESE FESTIVAL #2</p>
        </div>

        <div className="w-full min-h-auto md:min-h-screen flex items-center justify-center">
          <img src="/assets/denah.png" alt="Denah" className="w-full h-auto object-contain" />
        </div>
      </section>

      {/* --- SECTION DETAIL 3D --- */}
      <section id="detail3d" className="w-full bg-[#ffffff] mt-10 md:mt-40 pt-10 md:pt-0 pb-0 md:pb-40 px-4 md:px-20">
        <div className="max-w-5xl mx-auto bg-white rounded-[30px] md:rounded-[60px] p-4 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)] md:shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-gray-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {/* Image 1 */}
            <div className="order-1 group overflow-hidden rounded-[15px] md:rounded-[30px] aspect-[16/10] shadow-sm md:shadow-md bg-gray-100 relative">
              <img src="/assets/26.png" alt="Detail 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            {/* Image 2 */}
            <div className="order-2 group overflow-hidden rounded-[15px] md:rounded-[30px] aspect-[16/10] shadow-sm md:shadow-md bg-gray-100 relative">
              <img src="/assets/25.png" alt="Detail 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            {/* Image 3 */}
            <div className="order-3 group overflow-hidden rounded-[15px] md:rounded-[30px] aspect-[16/10] shadow-sm md:shadow-md bg-gray-100 relative">
              <img src="/assets/24.png" alt="Detail 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            {/* Label Merah */}
            <div className="order-last lg:order-4 bg-[#b1362f] rounded-[15px] md:rounded-[30px] flex items-center justify-center p-2 md:p-8 aspect-[16/10] shadow-lg hover:brightness-110 transition-all duration-300 transform hover:scale-[1.02] cursor-default">
              <h2 className="text-white font-[900] italic tracking-tighter text-center leading-none" style={{ fontSize: 'clamp(18px, 5vw, 55px)', fontFamily: '"Arial Black", sans-serif' }}>
                DETAIL 3D
              </h2>
            </div>
            {/* Image 4 */}
            <div className="order-4 lg:order-5 group overflow-hidden rounded-[15px] md:rounded-[30px] aspect-[16/10] shadow-sm md:shadow-md bg-gray-100 relative">
              <img src="/assets/23.png" alt="Detail 4" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            {/* Image 5 */}
            <div className="order-5 lg:order-6 group overflow-hidden rounded-[15px] md:rounded-[30px] aspect-[16/10] shadow-sm md:shadow-md bg-gray-100 relative">
              <img src="/assets/22.png" alt="Detail 5" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION SPESIFIKASI PANGGUNG --- */}
      <section id="spesifikasi" className="w-full bg-white py-20 px-4 md:px-10 overflow-hidden">
        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-[60%] z-20 relative">
            <div className="rounded-[25px] overflow-hidden shadow-2xl">
              <img src="/assets/panggung.png" alt="Desain Panggung" className="w-full h-auto object-cover block" />
            </div>
          </div>
          <div className="w-full lg:w-[50%] bg-[#5b7c4a] lg:rounded-r-[40px] lg:rounded-l-none rounded-[30px] py-10 px-6 md:pl-20 md:pr-10 shadow-xl -mt-5 lg:mt-0 lg:-ml-16 z-10">
            <h2 className="text-white font-bold tracking-tight mb-8 uppercase text-left" style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontFamily: 'Arial, sans-serif' }}>
              SPESIFIKASI PANGGUNG
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Panggung Ukuran', val: '8mX6mX5m' },
                { label: 'Sound', val: '10.000 Watt' },
                { label: 'Parled RGB, Moving Beam, Smoke', val: '' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 border border-white p-2 md:p-3 bg-transparent w-full">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 bg-[#5b7c4a] rounded-full"></div>
                  </div>
                  <p className="text-white text-xs md:text-base font-medium">
                    {item.label} <span className="font-bold">{item.val}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION MEDIA PARTNER --- */}
      <section
        id="media"
        className="relative bg-white py-16 md:py-24 px-5 md:px-20 border-t border-gray-100"
        style={{
          borderBottomLeftRadius: '35px',
          borderBottomRightRadius: '35px',
          zIndex: 45,
          position: 'relative',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-x-4 mb-10 text-center">
            <h2 className="font-black tracking-tighter" style={{ color: '#5b7c4a', fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(40px, 7vw, 72px)' }}>
              MEDIA
            </h2>
            <h2 className="font-black tracking-tighter" style={{ color: '#b1362f', fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(40px, 7vw, 72px)' }}>
              PARTNER
            </h2>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 md:gap-4">
            {isClient &&
              [...Array(45)].map((_, i) => {
                const logoPath = getSponsorLogoPath('media-partner', i + 1);
                return (
                  <div
                    key={i}
                    className="bg-[#f2f2f2] rounded-lg border-b-4 border-gray-300 flex items-center justify-center aspect-square text-gray-400 hover:bg-gray-100 hover:border-[#b1362f] hover:text-[#b1362f] active:translate-y-1 active:border-b-0 transition-all duration-200 group cursor-pointer overflow-hidden relative"
                  >
                    <img
                      src={logoPath}
                      alt={`media-${i + 1}`}
                      className="w-full h-full object-contain p-2 group-hover:scale-125 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 rounded-lg flex items-center justify-center">
                      <i className="fas fa-plus text-xl md:text-2xl group-hover:scale-125 transition-transform duration-300"></i>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full block overflow-hidden font-['Montserrat',sans-serif]">
        <div className="relative w-full h-auto md:h-[90vh] bg-cover bg-center bg-no-repeat flex flex-col" style={{ backgroundImage: "url('/assets/footer.png')" }}>
          <div className="absolute inset-0 bg-black/60 md:bg-gradient-to-r md:from-black/90 md:via-black/30 md:to-transparent z-0"></div>

          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-20 py-12 md:py-14 flex flex-col h-full justify-center md:justify-start">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="AWSM Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div className="text-white text-[10px] md:text-[12px] font-bold tracking-[0.2em] uppercase leading-tight">
                <span className="font-light opacity-70 block md:inline">PRESENTED BY</span> AWSM EVENT ORGANIZER
              </div>
            </div>

            <div className="mt-10 md:mt-32 mb-6 md:mb-8">
              <p className="text-white text-[10px] md:text-[14px] tracking-normal mb-3 uppercase opacity-90 font-medium">
                SOLO JAPANESE FESTIVAL #2 : <span className="font-bold">HEROES COME BACK!</span>
              </p>

              <h1 className="text-white text-[2.2rem] sm:text-[3.2rem] md:text-[5.2rem] font-black leading-[1.1] md:leading-[1] uppercase mb-4 tracking-tight">
                FROM EVENT TO
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/100">EVERLASTING MEMORY</span>
              </h1>

              <p className="text-white text-[11px] md:text-[14px] leading-relaxed tracking-wide font-medium max-w-[95%] md:max-w-2xl opacity-90">
                Kami Tidak Membuat Event, <br className="md:hidden" />
                <span className="font-bold"> Kami Membangun Pengalaman Yang Tak Terlupakan</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-10 mt-2 md:mt-8">
              <span className="text-white text-[10px] md:text-[12px] font-bold tracking-[0.2em] uppercase opacity-70">CONTACT US:</span>

              <div className="flex flex-col md:flex-row gap-2 md:gap-10">
                <a href="https://wa.me/6285138452566" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group !text-white no-underline py-1">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full group-hover:bg-green-500 transition-all shrink-0">
                    <i className="fa-brands fa-whatsapp text-base text-white"></i>
                  </div>
                  <span className="text-[11px] md:text-[13px] font-bold tracking-widest uppercase text-white">0851-3845-2566</span>
                </a>

                <a href="mailto:AWSM.EVENTORGANIZER@GMAIL.COM" className="flex items-center gap-3 group !text-white no-underline py-1">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full group-hover:bg-red-500 transition-all shrink-0">
                    <i className="fa-regular fa-envelope text-base text-white"></i>
                  </div>
                  <span className="text-[11px] md:text-[13px] font-bold tracking-widest uppercase text-white break-all md:break-normal">AWSM.EVENTORGANIZER@GMAIL.COM</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-black text-white/40 text-center py-6 md:py-8 text-[9px] md:text-[11px] tracking-[0.3em] uppercase border-t border-white/5 px-6">
          2026 © PRESENTED BY <span className="font-bold text-white/80">AWSM</span>
        </div>
      </footer>
    </div>
  );
}