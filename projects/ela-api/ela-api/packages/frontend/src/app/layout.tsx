import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ELA Inspector — Error Level Analysis Tool',
  description:
    'Detect image manipulation and forgery using Error Level Analysis (ELA). Upload any JPEG, PNG, or WebP image to reveal editing artifacts.',
  keywords: ['ELA', 'Error Level Analysis', 'image forensics', 'forgery detection', 'manipulation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
