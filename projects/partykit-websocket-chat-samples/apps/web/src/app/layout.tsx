import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';
export const metadata: Metadata = { title: 'ChatApp', description: 'Realtime chat' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
