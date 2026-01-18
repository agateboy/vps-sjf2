import React from 'react';

export const metadata = {
  title: 'Admin - Solo Japanese Festival #2',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body {
          background-color: #2c3e50;
          color: white;
        }
        .card {
          border-radius: 15px;
          overflow: hidden;
        }
        #reader {
          width: 100%;
          border-bottom: 5px solid #ddd;
        }
      `}</style>
      {children}
    </>
  );
}
