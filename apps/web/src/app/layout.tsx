import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parakeet AI - Real-Time AI Interview & Call Copilot',
  description: 'Instant answers, real-time speech transcription, and coding solutions during live technical interviews.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-[#f4f4f5] antialiased">
        {children}
      </body>
    </html>
  );
}
