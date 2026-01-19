import './globals.css';

export const metadata = {
  title: 'Solo Japanese Festival #2',
  description: 'Event seru di Lokananta Bloc, Surakarta',
  icons: {
    icon: '/assets/logo.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/assets/logo.ico" type="image/x-icon" />
        {/* Bootstrap */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;700&family=Shojumaru&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-container">
        {children}
        {/* Bootstrap Bundle JS */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </html>
  );
}
