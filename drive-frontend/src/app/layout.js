import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Vault — Secure Cloud Storage',
  description: 'A premium, secure cloud storage platform for your files and folders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
